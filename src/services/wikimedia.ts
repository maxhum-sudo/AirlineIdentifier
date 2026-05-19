import type { Airline, WikimediaImage } from '../types';

type CategoryMembersResponse = {
  query?: {
    categorymembers?: Array<{ title: string }>;
  };
};

type ImageInfoResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        imageinfo?: Array<{
          url?: string;
          thumburl?: string;
          descriptionurl?: string;
          extmetadata?: Record<string, { value?: string }>;
        }>;
      }
    >;
  };
};

const COMMONS_API_URL = 'https://commons.wikimedia.org/w/api.php';
const cache = new Map<string, Promise<WikimediaImage>>();
const htmlTagPattern = /<[^>]*>/g;

const stripHtml = (value: string | undefined) => {
  if (!value) {
    return '';
  }

  const documentValue = new DOMParser().parseFromString(value, 'text/html');
  return (documentValue.body.textContent || value.replace(htmlTagPattern, '')).trim();
};

const requestCommons = async <T>(params: Record<string, string>) => {
  const url = new URL(COMMONS_API_URL);
  url.searchParams.set('origin', '*');
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Wikimedia request failed with ${response.status}`);
  }

  return (await response.json()) as T;
};

const fetchFirstFileTitle = async (categoryTitle: string) => {
  const data = await requestCommons<CategoryMembersResponse>({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: categoryTitle,
    cmtype: 'file',
    cmlimit: '12',
  });

  const file = data.query?.categorymembers?.find((member) =>
    /\.(jpe?g|png|webp|gif)$/i.test(member.title),
  );

  if (!file) {
    throw new Error(`No Wikimedia image found for ${categoryTitle}`);
  }

  return file.title;
};

const fetchImageInfo = async (fileTitle: string) => {
  const data = await requestCommons<ImageInfoResponse>({
    action: 'query',
    format: 'json',
    prop: 'imageinfo',
    titles: fileTitle,
    iiprop: 'url|extmetadata',
    iiurlwidth: '900',
  });

  const page = Object.values(data.query?.pages || {})[0];
  const imageInfo = page?.imageinfo?.[0];

  if (!page || !imageInfo?.thumburl && !imageInfo?.url) {
    throw new Error(`No Wikimedia image metadata found for ${fileTitle}`);
  }

  const metadata = imageInfo.extmetadata || {};
  const author = stripHtml(metadata.Artist?.value) || 'Wikimedia Commons contributor';
  const license = stripHtml(metadata.LicenseShortName?.value || metadata.UsageTerms?.value) || 'See Wikimedia Commons';
  const credit = stripHtml(metadata.Credit?.value);
  const licenseUrl = stripHtml(metadata.LicenseUrl?.value);
  const title = stripHtml(metadata.ObjectName?.value) || page.title;
  const pageUrl = imageInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`;

  return {
    title,
    imageUrl: imageInfo.thumburl || imageInfo.url || '',
    pageUrl,
    author,
    license,
    licenseUrl,
    credit,
    attributionText: `${title} by ${author}, ${license}`,
  } satisfies WikimediaImage;
};

export const fetchTailImageForAirline = (airline: Airline) => {
  const tailImage = airline.images.find((image) => image.category === 'tail');

  if (!tailImage) {
    return Promise.reject(new Error(`No tail image source configured for ${airline.name}`));
  }

  const cacheKey = tailImage.citation.sourceCategoryTitle;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const imagePromise = fetchFirstFileTitle(cacheKey).then(fetchImageInfo);
  cache.set(cacheKey, imagePromise);
  return imagePromise;
};
