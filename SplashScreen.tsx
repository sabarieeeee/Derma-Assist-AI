import React from 'react';

interface SplashScreenProps {
  fadeOut: boolean;
}

// One orchestrated sequence (~2s, matching the timers in App.tsx):
// logo mark wipes in + a single light sheen passes over it -> wordmark -> tagline -> hairline loader.
const css = `
.ds-root{
  position:fixed;inset:0;z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:center;
  overflow:hidden;user-select:none;-webkit-user-select:none;
  font-family:'Geist','Inter',system-ui,sans-serif;
  background:
    radial-gradient(60% 46% at 50% 40%, rgba(200,245,66,0.10) 0%, rgba(200,245,66,0) 72%),
    linear-gradient(180deg,#031006 0%,#0a2a12 55%,#072010 100%);
  opacity:1;transition:opacity 700ms cubic-bezier(.4,0,.2,1);
}
.ds-root.ds-out{opacity:0;pointer-events:none}

.ds-stack{display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 24px;transform:translateY(-14px)}

.ds-mark-wrap{position:relative;width:76px;height:76px;margin-bottom:30px}
.ds-glow{
  position:absolute;left:50%;top:50%;width:280px;height:280px;margin:-140px 0 0 -140px;border-radius:50%;
  background:radial-gradient(closest-side, rgba(200,245,66,0.20), rgba(200,245,66,0) 100%);
  animation:ds-glow 1.4s ease-out both;
}
.ds-mark{position:relative;display:block;width:76px;height:76px;animation:ds-mark .85s cubic-bezier(.22,1,.36,1) both}
.ds-sheen{animation:ds-sheen .9s cubic-bezier(.45,0,.25,1) .75s both}

.ds-word{
  margin:0;font-weight:600;color:#fff;letter-spacing:-0.025em;line-height:1.1;font-size:clamp(28px,4.2vw,40px);
  animation:ds-rise .85s cubic-bezier(.22,1,.36,1) .55s both;
}
.ds-tag{
  margin:12px 0 0;font-weight:400;color:rgba(255,255,255,0.56);letter-spacing:0.005em;line-height:1.4;font-size:clamp(13px,1.6vw,15px);
  animation:ds-rise .85s cubic-bezier(.22,1,.36,1) .85s both;
}

.ds-track{
  position:absolute;left:50%;margin-left:-48px;width:96px;height:1px;background:rgba(255,255,255,0.14);overflow:hidden;
  bottom:calc(env(safe-area-inset-bottom,0px) + 56px);
}
.ds-fill{width:100%;height:100%;background:#c8f542;transform-origin:left center;animation:ds-load 2s linear both}

@keyframes ds-mark{from{opacity:0;clip-path:inset(0 100% 0 0);transform:scale(.94)}to{opacity:1;clip-path:inset(0 0 0 0);transform:scale(1)}}
@keyframes ds-sheen{from{transform:translateX(0)}to{transform:translateX(46px)}}
@keyframes ds-glow{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:scale(1)}}
@keyframes ds-rise{from{opacity:0;transform:translateY(8px);filter:blur(6px)}to{opacity:1;transform:none;filter:blur(0)}}
@keyframes ds-load{from{transform:scaleX(0)}to{transform:scaleX(1)}}

@media (prefers-reduced-motion:reduce){
  .ds-glow,.ds-mark,.ds-word,.ds-tag{animation:none}
  .ds-sheen{display:none}
  .ds-fill{animation:none}
}
`;

export const SplashScreen: React.FC<SplashScreenProps> = ({ fadeOut }) => {
  return (
    <div
      className={`ds-root${fadeOut ? ' ds-out' : ''}`}
      role="status"
      aria-label="Loading Derma Assist AI"
    >
      <style>{css}</style>

      <div className="ds-stack">
        <div className="ds-mark-wrap">
          <div className="ds-glow" />
          <svg className="ds-mark" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <clipPath id="ds-d">
                <path d="M6 4H15C20.5228 4 25 8.47715 25 14C25 19.5228 20.5228 24 15 24H6V4Z" />
              </clipPath>
              <linearGradient id="ds-sheen-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.6" />
                <stop offset="1" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M6 4H15C20.5228 4 25 8.47715 25 14C25 19.5228 20.5228 24 15 24H6V4Z" fill="#c8f542" />
            <g clipPath="url(#ds-d)">
              <g transform="skewX(-14)">
                <rect className="ds-sheen" x="-16" y="0" width="14" height="28" fill="url(#ds-sheen-grad)" />
              </g>
            </g>
          </svg>
        </div>

        <h1 className="ds-word">Derma Assist AI</h1>
        <p className="ds-tag">Your Trusted Skin Health Assistant</p>
      </div>

      <div className="ds-track" aria-hidden="true">
        <div className="ds-fill" />
      </div>
    </div>
  );
};

export default SplashScreen;
