export interface AnimeCard {
  title: string;
  poster: string;
  episodes?: string;
  animeId: string;
  latestReleaseDate?: string;
  releaseDay?: string;
  type?: string;
  score?: string;
}

export interface Pagination {
  currentPage: number;
  prevPage: number | null;
  hasPrevPage: boolean;
  nextPage: number | null;
  hasNextPage: boolean;
  totalPages: number;
}

export interface AnimeDetail {
  title: string;
  poster: string;
  japaneseTitle?: string;
  score?: string;
  producer?: string;
  type?: string;
  status?: string;
  totalEpisodes?: string;
  duration?: string;
  releaseDate?: string;
  studio?: string;
  genre?: string;
  synopsis?: string;
  batchId?: string;
  episodes: Episode[];
}

export interface Episode {
  title: string;
  episodeId: string;
  uploadedDate?: string;
}

export interface StreamData {
  title: string;
  animeId: string;
  episodeId: string;
  streamUrl: string;
  downloadLinks: DownloadLink[];
  prevEpisodeId: string | null;
  nextEpisodeId: string | null;
}

export interface DownloadLink {
  quality: string;
  links: {
    provider: string;
    url: string;
  }[];
}
