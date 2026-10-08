import React, { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

type MediaEmbedProps = {
  embedUrl: string;
  title: string;
  onLoadStart: () => void;
  onLoad: () => void;
  onError: (message: string) => void;
};

type YoutubePlayer = { destroy: () => void };
type YoutubeApi = {
  Player: new (
    iframe: HTMLIFrameElement,
    options: {
      events: {
        onReady: () => void;
        onError: (event: { data: number }) => void;
      };
    },
  ) => YoutubePlayer;
};

declare global {
  interface Window {
    YT?: YoutubeApi;
  }
}

function youtubeErrorMessage(code: number) {
  if (code === 100 || code === 101 || code === 150) {
    return 'YouTube reports that this video is unavailable or cannot be embedded.';
  }
  if (code === 153) return 'YouTube could not verify the player origin.';
  return `YouTube could not play this media (error ${code}).`;
}

export function MediaEmbed({ embedUrl, title, onLoadStart, onLoad, onError }: MediaEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const callbacks = useRef({ onLoadStart, onLoad, onError });
  callbacks.current = { onLoadStart, onLoad, onError };
  const isYouTube = embedUrl.includes('youtube.com/embed/');

  useEffect(() => {
    callbacks.current.onLoadStart();
    if (!isYouTube) return;

    let cancelled = false;
    let player: YoutubePlayer | null = null;
    const script = document.querySelector<HTMLScriptElement>('script[data-royalhouse-youtube-api]');
    let apiScript = script;
    if (!window.YT?.Player && !apiScript) {
      apiScript = document.createElement('script');
      apiScript.src = 'https://www.youtube.com/iframe_api';
      apiScript.dataset.royalhouseYoutubeApi = 'true';
      apiScript.onerror = () => callbacks.current.onError('YouTube’s player API could not be loaded.');
      document.head.appendChild(apiScript);
    }

    const attachPlayer = () => {
      if (cancelled || player || !window.YT?.Player || !iframeRef.current) return;
      try {
        player = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: () => callbacks.current.onLoad(),
            onError: (event) => callbacks.current.onError(youtubeErrorMessage(event.data)),
          },
        });
      } catch {
        callbacks.current.onError('YouTube’s player could not be initialized.');
      }
    };

    attachPlayer();
    const poll = window.setInterval(attachPlayer, 100);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      player?.destroy();
    };
  }, [embedUrl, isYouTube]);

  return React.createElement('iframe', {
    ref: iframeRef,
    src: embedUrl,
    title,
    allow: 'autoplay; encrypted-media; fullscreen; picture-in-picture',
    allowFullScreen: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    ...(isYouTube ? {} : { onLoad }),
    onError: () => onError('The media provider could not be reached.'),
    style: {
      width: '100%',
      height: '100%',
      border: 0,
      display: 'block',
      backgroundColor: 'black',
    } satisfies CSSProperties,
  });
}
