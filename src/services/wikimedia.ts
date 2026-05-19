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

const preloadImage = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error(`Image failed to load: ${url}`));
    image.src = url;
  });

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

const isImageFileTitle = (title: string) => /\.(jpe?g|png|webp|gif)$/i.test(title);

const fetchFileTitlesFromCategory = async (categoryTitle: string, limit = 12) => {
  const data = await requestCommons<CategoryMembersResponse>({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: categoryTitle,
    cmtype: 'file',
    cmlimit: String(limit),
  });

  return data.query?.categorymembers?.map((member) => member.title).filter(isImageFileTitle) || [];
};

const fetchFirstSubcategoryTitle = async (categoryTitle: string) => {
  const data = await requestCommons<CategoryMembersResponse>({
    action: 'query',
    format: 'json',
    list: 'categorymembers',
    cmtitle: categoryTitle,
    cmtype: 'subcat',
    cmlimit: '5',
  });

  return data.query?.categorymembers?.[0]?.title;
};

const fetchFirstFileTitle = async (categoryTitle: string) => {
  const [directFileTitle] = await fetchFileTitlesFromCategory(categoryTitle);

  if (directFileTitle) {
    return directFileTitle;
  }

  const subcategoryTitle = await fetchFirstSubcategoryTitle(categoryTitle);
  const [subcategoryFileTitle] = subcategoryTitle
    ? await fetchFileTitlesFromCategory(subcategoryTitle)
    : [];

  if (subcategoryFileTitle) {
    return subcategoryFileTitle;
  }

  throw new Error(`No Wikimedia image found for ${categoryTitle}`);
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

  const wikimediaImage = {
    fileTitle,
    title,
    imageUrl: imageInfo.thumburl || imageInfo.url || '',
    pageUrl,
    author,
    license,
    licenseUrl,
    credit,
    attributionText: `${title} by ${author}, ${license}`,
  } satisfies WikimediaImage;

  await preloadImage(wikimediaImage.imageUrl);
  return wikimediaImage;
};

export const fetchWikimediaImageByFileTitle = (fileTitle: string) => {
  const cached = cache.get(fileTitle);

  if (cached) {
    return cached;
  }

  const imagePromise = fetchImageInfo(fileTitle);
  cache.set(fileTitle, imagePromise);
  return imagePromise;
};

export const fetchTailImageCandidatesForAirline = async (airline: Airline, limit = 12) => {
  const tailImage = airline.images.find((image) => image.category === 'tail');

  if (!tailImage) {
    throw new Error(`No tail image source configured for ${airline.name}`);
  }

  const categoryTitle = tailImage.citation.sourceCategoryTitle;
  const directFileTitles = await fetchFileTitlesFromCategory(categoryTitle, limit);
  const subcategoryTitle = await fetchFirstSubcategoryTitle(categoryTitle);
  const subcategoryFileTitles = subcategoryTitle
    ? await fetchFileTitlesFromCategory(subcategoryTitle, limit)
    : [];
  const fileTitles = Array.from(new Set([...directFileTitles, ...subcategoryFileTitles])).slice(
    0,
    limit,
  );
  const candidateResults = await Promise.allSettled(fileTitles.map(fetchWikimediaImageByFileTitle));

  return candidateResults
    .filter((result): result is PromiseFulfilledResult<WikimediaImage> => result.status === 'fulfilled')
    .map((result) => result.value);
};

export const fetchTailImageForAirline = (airline: Airline) => {
  const tailImage = airline.images.find((image) => image.category === 'tail');

  if (!tailImage) {
    return Promise.reject(new Error(`No tail image source configured for ${airline.name}`));
  }

  if (tailImage.src) {
    return Promise.resolve({
      fileTitle: tailImage.selectedFileTitle || tailImage.id,
      title: tailImage.alt,
      imageUrl: tailImage.src,
      pageUrl: tailImage.citation.sourceCategoryUrl,
      author: 'See local license metadata',
      license: tailImage.licensePath || 'See local license metadata',
      attributionText: tailImage.alt,
    } satisfies WikimediaImage);
  }

  const cacheKey = tailImage.selectedFileTitle || tailImage.citation.sourceCategoryTitle;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const imagePromise = tailImage.selectedFileTitle
    ? fetchImageInfo(tailImage.selectedFileTitle)
    : fetchFirstFileTitle(cacheKey).then(fetchImageInfo);
  cache.set(cacheKey, imagePromise);
  return imagePromise;
};
