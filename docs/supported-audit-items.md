# Supported Audit Items

The full list could be found [here](https://github.com/fedeoo/lighthouse-auto-fix/wiki/Feasible-Audit-Result).


## Performance 

 S  | id | title | description
--- |  ---  | --- | ---
✅ | uses-responsive-images | Properly size images | Serve images that are appropriately-sized to save cellular data and improve load time. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/oversized-images). 
❌ | offscreen-images | Defer offscreen images | Consider lazy-loading offscreen and hidden images after all critical resources have finished loading to lower time to interactive. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/offscreen-images). 
❌ | unminified-css | Minify CSS | Minifying CSS files can reduce network payload sizes. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/minify-css). 
❌ | unminified-javascript | Minify JavaScript | Minifying JavaScript files can reduce payload sizes and script parse time. [Learn more](https://developers.google.com/speed/docs/insights/MinifyResources). 
❌ | unused-css-rules | Remove unused CSS | Remove dead rules from stylesheets and defer the loading of CSS not used for above-the-fold content to reduce unnecessary bytes consumed by network activity. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/unused-css). 
❌ | uses-optimized-images | Efficiently encode images | Optimized images load faster and consume less cellular data. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/optimize-images). 
❌ | uses-webp-images | Serve images in next-gen formats | Image formats like JPEG 2000, JPEG XR, and WebP often provide better compression than PNG or JPEG, which means faster downloads and less data consumption. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/webp). 
❌ | uses-text-compression | Enable text compression | Text-based resources should be served with compression (gzip, deflate or brotli) to minimize total network bytes. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/text-compression). 
❌ | uses-rel-preconnect | Preconnect to required origins | Consider adding preconnect or dns-prefetch resource hints to establish early connections to important third-party origins. [Learn more](https://developers.google.com/web/fundamentals/performance/resource-prioritization#preconnect). 
❌ | redirects | Avoid multiple page redirects | Redirects introduce additional delays before the page can be loaded. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/redirects). 
❌ | uses-rel-preload | Preload key requests | Consider using <link rel=preload> to prioritize fetching resources that are currently requested later in page load. [Learn more](https://developers.google.com/web/tools/lighthouse/audits/preload). 
❌ | efficient-animated-content | Use video formats for animated content | Large GIFs are inefficient for delivering animated content. Consider using MPEG4/WebM videos for animations and PNG/WebP for static images instead of GIF to save network bytes. [Learn more](https://developers.google.com/web/fundamentals/performance/optimizing-content-efficiency/replace-animated-gifs-with-video/) 

