
<div align="center">

<svg width="250" height="250" viewBox="0 0 250 250"
xmlns="http://www.w3.org/2000/svg">

<defs>
<linearGradient id="rainbow">
<stop offset="0%" stop-color="#00FFFF"/>
<stop offset="30%" stop-color="#8A2BE2"/>
<stop offset="60%" stop-color="#FF00FF"/>
<stop offset="100%" stop-color="#00FFFF"/>
</linearGradient>
<filter id="glow">
<feGaussianBlur stdDeviation="5" result="blur"/>
<feMerge>
<feMergeNode in="blur"/>
<feMergeNode in="SourceGraphic"/>
</feMerge>
</filter>
</defs>

<circle cx="125" cy="125" r="95"
fill="none" stroke="url(#rainbow)"
stroke-width="4" filter="url(#glow)"
stroke-dasharray="500 100">
<animateTransform attributeName="transform"
type="rotate" from="0 125 125"
to="360 125 125" dur="4s"
repeatCount="indefinite"/>
</circle>

<circle cx="125" cy="125" r="78"
fill="none" stroke="#00FFFF"
stroke-width="2" stroke-dasharray="8 8"
filter="url(#glow)">
<animateTransform attributeName="transform"
type="rotate" from="360 125 125"
to="0 125 125" dur="7s"
repeatCount="indefinite"/>
</circle>

<text x="125" y="117" text-anchor="middle"
fill="#00FFFF" font-size="27"
font-weight="bold" filter="url(#glow)">
NIKKA
</text>

<text x="125" y="148" text-anchor="middle"
fill="#D000FF" font-size="27"
font-weight="bold" filter="url(#glow)">
X MD
</text>

</svg>

</div>
