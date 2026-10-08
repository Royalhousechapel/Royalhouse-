import React from 'react';
import { WebView } from 'react-native-webview';
import type { WebViewMessageEvent } from 'react-native-webview';

type MediaEmbedProps = {
  embedUrl: string;
  title: string;
  onLoadStart: () => void;
  onLoad: () => void;
  onError: (message: string) => void;
};

export function MediaEmbed({ embedUrl, title, onLoadStart, onLoad, onError }: MediaEmbedProps) {
  const isYouTube = embedUrl.includes('youtube.com/embed/');
  const escapedEmbedUrl = embedUrl.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const html = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<style>html,body,#player{width:100%;height:100%;margin:0;background:black;overflow:hidden}iframe{width:100%;height:100%;border:0}</style>
</head><body><div id="player"><iframe id="provider-player" src="${escapedEmbedUrl}" title="${title.replace(/"/g, '&quot;')}" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
<script>
(function(){
  function send(type, message) {
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({type:type,message:message}));
  }
  var frame = document.getElementById('provider-player');
  ${isYouTube ? `
  var api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.onerror = function(){ send('error', 'YouTube’s player API could not be loaded.'); };
  window.onYouTubeIframeAPIReady = function(){
    try {
      new YT.Player(frame, {
        events: {
          onReady: function(){ send('ready'); },
          onError: function(event){
            var code = event.data;
            var message = (code === 100 || code === 101 || code === 150)
              ? 'YouTube reports that this video is unavailable or cannot be embedded.'
              : 'YouTube could not play this media (error ' + code + ').';
            send('error', message);
          }
        }
      });
    } catch (error) { send('error', 'YouTube’s player could not be initialized.'); }
  };
  document.head.appendChild(api);` : `
  frame.addEventListener('load', function(){ send('ready'); });
  frame.addEventListener('error', function(){ send('error', 'Spotify’s player could not be reached.'); });`}
})();
</script></body></html>`;

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: { type?: string; message?: string } = JSON.parse(event.nativeEvent.data);
      if (message.type === 'ready') onLoad();
      if (message.type === 'error') onError(message.message || 'The media provider could not be reached.');
    } catch {
      onError('The media provider returned an unreadable response.');
    }
  };

  return (
    <WebView
      source={{ html, baseUrl: isYouTube ? 'https://www.youtube.com' : 'https://open.spotify.com' }}
      accessibilityLabel={title}
      javaScriptEnabled
      domStorageEnabled
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction
      onLoadStart={onLoadStart}
      onMessage={handleMessage}
      onError={(event) => onError(event.nativeEvent.description || 'The media provider could not be reached.')}
      onHttpError={(event) => onError(`The media provider returned an error (${event.nativeEvent.statusCode}).`)}
    />
  );
}
