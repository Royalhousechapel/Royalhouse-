export type SermonFormat = 'audio' | 'video';

export type MediaItem = {
  id: string;
  title: string;
  speaker: string;
  series: string;
  duration: string;
  format: SermonFormat;
  provider: 'Spotify' | 'YouTube';
  sourceUrl: string;
  embedUrl: string;
  color: string;
  publishedAt?: string;
};

export const sermonData: MediaItem[] = [
  {
    id: 'royalhouse-podcast-231',
    title: 'Episode 231: TIME TO MOVE FORWARD',
    speaker: 'Rev. Sam Korankye Ankrah',
    series: 'Royalhouse Chapel International Podcast',
    duration: '1 hr 7 min',
    format: 'audio',
    provider: 'Spotify',
    sourceUrl: 'https://open.spotify.com/episode/2cztNMwKXJDYYYeyF261ke',
    embedUrl: 'https://open.spotify.com/embed/episode/2cztNMwKXJDYYYeyF261ke',
    color: '#17275B',
    publishedAt: 'Aug 12, 2026',
  },
  {
    id: 'royalhouse-podcast-230',
    title: 'Episode 230: IT IS WELL',
    speaker: 'Rev. Sam Korankye Ankrah',
    series: 'Royalhouse Chapel International Podcast',
    duration: '1 hr 23 min',
    format: 'audio',
    provider: 'Spotify',
    sourceUrl: 'https://open.spotify.com/episode/3k882Tk9VFGFSKwJddp474',
    embedUrl: 'https://open.spotify.com/embed/episode/3k882Tk9VFGFSKwJddp474',
    color: '#6C5321',
    publishedAt: 'Jul 6, 2026',
  },
  {
    id: 'royalhouse-podcast-229',
    title: 'Episode 229: THE FIRE OF GOD',
    speaker: 'Rev. Sam Korankye Ankrah',
    series: 'Royalhouse Chapel International Podcast',
    duration: '56 min 32 sec',
    format: 'audio',
    provider: 'Spotify',
    sourceUrl: 'https://open.spotify.com/episode/1p7RB8bvcM5M99dYjvTeKP',
    embedUrl: 'https://open.spotify.com/embed/episode/1p7RB8bvcM5M99dYjvTeKP',
    color: '#253C58',
    publishedAt: 'Jun 7, 2026',
  },
  {
    id: 'royalhouse-video-word-explosion',
    title: 'Word Explosion Repeat | Sweet Mercy II | 06.10.26',
    speaker: 'Royalhouse Chapel (PowerlineTV)',
    series: 'Service replay',
    duration: '1 hr 28 min 31 sec',
    format: 'video',
    provider: 'YouTube',
    sourceUrl: 'https://www.youtube.com/watch?v=qLjq0ym1M-8',
    embedUrl: 'https://www.youtube.com/embed/qLjq0ym1M-8?playsinline=1&rel=0&enablejsapi=1',
    color: '#314A6B',
  },
  {
    id: 'royalhouse-video-family-life',
    title: 'Family Life Series — Playback of 40th Anniversary Renewal of Vows',
    speaker: 'Royalhouse Chapel (PowerlineTV)',
    series: 'Service replay',
    duration: '2 hr 38 min 25 sec',
    format: 'video',
    provider: 'YouTube',
    sourceUrl: 'https://www.youtube.com/watch?v=rX1ZiYtgnmc',
    embedUrl: 'https://www.youtube.com/embed/rX1ZiYtgnmc?playsinline=1&rel=0&enablejsapi=1',
    color: '#6C5321',
  },
  {
    id: 'royalhouse-video-communion-service',
    title: 'Convention of Saints 2026 | Communion Service | 04.10.26',
    speaker: 'Royalhouse Chapel (PowerlineTV)',
    series: 'Service replay',
    duration: '4 hr 55 min 19 sec',
    format: 'video',
    provider: 'YouTube',
    sourceUrl: 'https://www.youtube.com/watch?v=hRr4kBWsvfs',
    embedUrl: 'https://www.youtube.com/embed/hRr4kBWsvfs?playsinline=1&rel=0&enablejsapi=1',
    color: '#253C58',
  },
];

export const liveMedia: MediaItem = {
  id: 'royalhouse-live-stream',
  title: 'Royalhouse Chapel live service',
  speaker: 'Royalhouse Chapel (PowerlineTV)',
  series: 'Official live stream',
  duration: 'Live',
  format: 'video',
  provider: 'YouTube',
  sourceUrl: 'https://www.youtube.com/@powerlinetv/live',
  embedUrl: 'https://www.youtube.com/embed/live_stream?channel=UCX4w4rusJfl8YW56oM0h43A&playsinline=1&enablejsapi=1',
  color: '#17275B',
};
