// Water Tank Custom Card for Home Assistant
// Copy vào: /config/www/community/water-tank-card/water-tank-card.js

class WaterTankCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static getConfigElement() {
    return document.createElement('water-tank-card-editor');
  }

  static getStubConfig() {
    return {
      name: 'Bể Nước Sinh Hoạt',
      entity_level: '',
      entity_current: '',
      entity_power: '',
      entity_month: '',
      entity_temperature: '',
      entity_water_day: '',
      entity_water_month: '',
      pump_threshold: 0.5,
      show_temperature: true,
      show_brand: true,
      show_wave: true,
      show_pump_animation: true,
      show_scan_line: true,
      decimal_places: 2,
      color_water: '#29B6F6',
      color_bg: 'transparent',
      color_accent: '#FFD600',
    };
  }

  setConfig(config) {
    if (!config.entity_level) throw new Error('entity_level is required');
    this._config = { ...WaterTankCard.getStubConfig(), ...config };
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  _val(entity_id, fallback = 0) {
    if (!this._hass || !entity_id) return fallback;
    const s = this._hass.states[entity_id];
    return s ? (parseFloat(s.state) || fallback) : fallback;
  }

  _hexToRgb(hex) {
    const h = (hex || '#000000').replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)].join(',');
  }

  render() {
    if (!this._config) return;
    const c = this._config;
    const lvl  = this._val(c.entity_level);
    const cur  = this._val(c.entity_current);
    const pwr  = this._val(c.entity_power);
    const mon  = this._val(c.entity_month);
    const temp = this._val(c.entity_temperature);
    const wday = this._val(c.entity_water_day);
    const wmon = this._val(c.entity_water_month);
    const pumping = cur > (parseFloat(c.pump_threshold) || 0.5);
    const dec  = parseInt(c.decimal_places) >= 0 ? parseInt(c.decimal_places) : 2;
    const cw   = c.color_water  || '#29B6F6';
    const cb   = c.color_bg     || '#0f1c2e';
    const ca   = c.color_accent || '#FFD600';
    const rgb  = this._hexToRgb(ca);

    const waterTop = Math.max(57, 137 - Math.round(80 * lvl / 100));
    const waterH   = 137 - waterTop;

    const waveKf = c.show_wave !== false ? `
      @keyframes wave-move     { from{transform:translateX(0)}    to{transform:translateX(-50%)} }
      @keyframes wave-move-rev { from{transform:translateX(-50%)} to{transform:translateX(0)}    }
      .wave1 { animation: wave-move 2s linear infinite; }
      .wave2 { animation: wave-move-rev 1.5s linear infinite; }` : '';

    const pumpKf = c.show_pump_animation !== false ? `
      @keyframes pump-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      .pump-spin { animation: pump-spin 0.7s linear infinite; transform-origin: 8px 141px; }` : '';

    const waveSvg = c.show_wave !== false ? `
      <svg x="-140" y="${waterTop-12}" width="560" height="20" viewBox="0 0 560 20" overflow="visible">
        <path class="wave1" d="M0 10 Q35 0 70 10 Q105 20 140 10 Q175 0 210 10 Q245 20 280 10 Q315 0 350 10 Q385 20 420 10 Q455 0 490 10 Q525 20 560 10 L560 20 L0 20 Z" fill="${cw}" opacity="0.65"/>
      </svg>` : '';

    const brandSvg = c.show_brand !== false
      ? `<text x="140" y="108" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="700" fill="rgba(255,255,255,0.18)" letter-spacing="4">SONHA</text>` : '';

    const pumpCircle = c.show_pump_animation !== false
      ? `<circle class="${pumping ? 'pump-spin' : ''}" cx="8" cy="141" r="5" fill="none" stroke="${pumping ? cw : '#5a7a98'}" stroke-width="1.5" stroke-dasharray="${pumping ? '3 2' : '2 3'}"/>`
      : `<circle cx="8" cy="141" r="5" fill="none" stroke="#5a7a98" stroke-width="1.5" stroke-dasharray="2 3"/>`;

    const dropSvg = pumping ? `
      <rect class="drop1" x="30" y="24" width="2" height="14" rx="1" fill="${cw}"/>
      <rect class="drop2" x="33" y="24" width="2" height="10" rx="1" fill="${cw}"/>` : '';

    const tempBlock = c.show_temperature !== false ? `
      <div class="side-metric">
        <span class="sm-label">Nhiệt độ</span>
        <span class="sm-value">${temp.toFixed(1)}<span class="sm-unit"> °C</span></span>
      </div>` : '';

    const scanDiv = c.show_scan_line !== false
      ? `<div class="scan-line"></div>` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        @keyframes pulse-dot  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.7)} }
        @keyframes fill-pulse { 0%,100%{opacity:1} 50%{opacity:0.82} }
        @keyframes water-drop { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(8px)} }
        @keyframes scan-line  {
          0%   { transform: translateY(0);    opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { transform: translateY(500px); opacity: 0; }
        }
        .drop1 { animation: water-drop 0.35s linear 0s    infinite; }
        .drop2 { animation: water-drop 0.35s linear 0.17s infinite; }
        .water-rect { animation: fill-pulse 3s ease-in-out infinite; }
        ${waveKf}
        ${pumpKf}

        /* wrapper ngoài: clip bo góc, overflow hidden */
        .wrap {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          background: ${cb};
          border: 1px solid rgba(41,182,246,0.15);
          font-family: 'Segoe UI', Arial, sans-serif;
        }

        /* scan-line: absolute trong wrap, không bị clip bởi inner */
        .scan-line {
          position: absolute;
          left: 0; right: 0; top: 0;
          height: 2px;
          background: linear-gradient(90deg, transparent, rgba(41,182,246,0.7), transparent);
          animation: scan-line 3s linear infinite;
          pointer-events: none;
          z-index: 100;
        }

        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 14px 8px;
          border-bottom: 1px solid rgba(41,182,246,0.12);
        }
        .title { font-size: 11px; font-weight: 700; color: rgba(232,244,253,0.5); letter-spacing: 2.5px; text-transform: uppercase; }
        .badge { display: flex; align-items: center; gap: 5px; font-size: 10px; font-weight: 700; color: #00E676; letter-spacing: 1.5px; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #00E676; display: inline-block; animation: pulse-dot 2s ease-in-out infinite; }

        .body { display: flex; gap: 10px; align-items: flex-end; padding: 14px 14px 6px; }
        .tank-wrap { flex: 1; position: relative; }
        .tank-svg { width: 100%; display: block; }
        .level-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); text-align: center; pointer-events: none; }
        .level-num { font-family: 'Courier New', monospace; font-size: 26px; color: #fff; line-height: 1; text-shadow: 0 0 16px rgba(255,255,255,0.5); }
        .level-pct { font-size: 11px; color: rgba(255,255,255,0.65); letter-spacing: 1px; font-weight: 600; }

        .side { display: flex; flex-direction: column; gap: 7px; min-width: 86px; }
        .side-metric { background: rgba(255,255,255,0.04); border: 1px solid rgba(41,182,246,0.2); border-radius: 8px; padding: 7px 9px; text-align: center; }
        .side-metric.ac { border-color: rgba(${rgb},0.28); }
        .sm-label { font-size: 9px; color: rgba(232,244,253,0.5); letter-spacing: 1.5px; text-transform: uppercase; display: block; }
        .sm-value { font-family: 'Courier New', monospace; font-size: 15px; color: ${cw}; display: block; margin-top: 1px; }
        .sm-value.ac { color: ${ca}; }
        .sm-unit { font-size: 9px; color: rgba(232,244,253,0.45); }

        .bottom { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; background: rgba(41,182,246,0.1); border-top: 1px solid rgba(41,182,246,0.12); }
        .bcell { background: #0f1c2e; padding: 10px 8px; display: flex; align-items: center; gap: 7px; }
        .bicon { width: 26px; height: 26px; border-radius: 6px; flex-shrink: 0; background: rgba(41,182,246,0.08); border: 1px solid rgba(41,182,246,0.18); display: flex; align-items: center; justify-content: center; }
        .bicon.ac { background: rgba(${rgb},0.07); border-color: rgba(${rgb},0.2); }
        .blabel { font-size: 9px; color: rgba(232,244,253,0.45); letter-spacing: 0.5px; text-transform: uppercase; display: block; }
        .bvalue { font-family: 'Courier New', monospace; font-size: 14px; color: #e8f4fd; display: block; white-space: nowrap; }
        .bvalue.ac { color: ${ca}; }
      </style>

      <div class="wrap" id="card">
        ${scanDiv}

        <div class="header">
          <span class="title">${c.name || 'Bể Nước'}</span>
          <span class="badge"><span class="dot"></span>ONLINE</span>
        </div>

        <div class="body">
          <div class="tank-wrap">
            <svg class="tank-svg" viewBox="0 0 280 175" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <clipPath id="tc">
                  <ellipse cx="140" cy="22" rx="120" ry="20"/>
                  <rect x="20" y="22" width="240" height="115"/>
                  <ellipse cx="140" cy="137" rx="120" ry="20"/>
                </clipPath>
                <linearGradient id="gWall" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#3a5575"/>
                  <stop offset="50%" stop-color="#b8d4e8"/>
                  <stop offset="100%" stop-color="#2e4560"/>
                </linearGradient>
                <linearGradient id="gWater" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="${cw}"/>
                  <stop offset="100%" stop-color="#0277BD"/>
                </linearGradient>
              </defs>
              <rect x="20" y="22" width="240" height="115" fill="url(#gWall)"/>
              <g clip-path="url(#tc)">
                <rect class="water-rect" x="20" y="${waterTop}" width="240" height="${waterH}" fill="url(#gWater)"/>
                ${waveSvg}
                ${brandSvg}
              </g>
              <line x1="16" y1="57"  x2="22" y2="57"  stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
              <line x1="16" y1="97"  x2="22" y2="97"  stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
              <line x1="16" y1="137" x2="22" y2="137" stroke="rgba(255,255,255,0.4)" stroke-width="1.5"/>
              <text x="13" y="60"  text-anchor="end" font-size="7.5" fill="rgba(255,255,255,0.4)" font-family="monospace">100</text>
              <text x="13" y="100" text-anchor="end" font-size="7.5" fill="rgba(255,255,255,0.4)" font-family="monospace">50</text>
              <text x="13" y="140" text-anchor="end" font-size="7.5" fill="rgba(255,255,255,0.4)" font-family="monospace">0</text>
              <ellipse cx="140" cy="22" rx="120" ry="20" fill="#5a7a98"/>
              <ellipse cx="140" cy="22" rx="120" ry="20" fill="none" stroke="#7a9dc0" stroke-width="2"/>
              <ellipse cx="140" cy="137" rx="120" ry="20" fill="url(#gWater)" opacity="0.9"/>
              <rect x="28" y="-2" width="8" height="30" rx="2" fill="#5a7a98" stroke="#8babc8" stroke-width="0.5"/>
              ${dropSvg}
              <rect x="48"  y="155" width="9" height="15" rx="2" fill="#2e4560"/>
              <rect x="110" y="155" width="9" height="15" rx="2" fill="#2e4560"/>
              <rect x="161" y="155" width="9" height="15" rx="2" fill="#2e4560"/>
              <rect x="223" y="155" width="9" height="15" rx="2" fill="#2e4560"/>
              <rect x="5"  y="125" width="17" height="5"  rx="2" fill="#2e4560" stroke="#5a7a98" stroke-width="0.5"/>
              <rect x="2"  y="112" width="6"  height="16" rx="2" fill="#2e4560" stroke="#5a7a98" stroke-width="0.5"/>
              <rect x="-2" y="134" width="22" height="14" rx="3" fill="#1a3050" stroke="#5a7a98" stroke-width="1"/>
              ${pumpCircle}
              <circle cx="8" cy="141" r="2" fill="${pumping ? cw : '#5a7a98'}"/>
            </svg>
            <div class="level-overlay">
              <div class="level-num">${lvl.toFixed(dec)}</div>
              <div class="level-pct">%</div>
            </div>
          </div>

          <div class="side">
            ${tempBlock}
            <div class="side-metric">
              <span class="sm-label">Nước / Ngày</span>
              <span class="sm-value">${wday.toFixed(1)}<span class="sm-unit"> L</span></span>
            </div>
            <div class="side-metric ac">
              <span class="sm-label">Nước / Tháng</span>
              <span class="sm-value ac">${wmon.toFixed(1)}<span class="sm-unit"> L</span></span>
            </div>
          </div>
        </div>

        <div class="bottom">
          <div class="bcell">
            <div class="bicon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${cw}" stroke-width="2.5" stroke-linecap="round">
                <path d="M2 12 C5 6 8 6 12 12 C16 18 19 18 22 12"/>
              </svg>
            </div>
            <div><span class="blabel">Dòng điện</span><span class="bvalue">${cur.toFixed(2)} A</span></div>
          </div>
          <div class="bcell">
            <div class="bicon">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${cw}" stroke-width="2.5" stroke-linecap="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
              </svg>
            </div>
            <div><span class="blabel">Công suất</span><span class="bvalue">${pwr.toFixed(0)} W</span></div>
          </div>
          <div class="bcell">
            <div class="bicon ac">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${ca}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
            </div>
            <div><span class="blabel">1 Tháng</span><span class="bvalue ac">${mon.toFixed(2)} kW</span></div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.getElementById('card').addEventListener('click', () => {
      if (!this._config?.entity_level) return;
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: this._config.entity_level },
        bubbles: true, composed: true,
      }));
    });
  }

  getCardSize() { return 4; }
}

// ─── Visual Editor ────────────────────────────────────────────────────────────

class WaterTankCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass   = null;
  }

  setConfig(config) {
    this._config = config;
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    // nếu chưa render thì render lần đầu
    if (!this._rendered) {
      this._render();
      return;
    }
    // chỉ cập nhật hass cho pickers
    this.shadowRoot.querySelectorAll('ha-entity-picker').forEach(p => {
      p.hass = hass;
    });
  }

  _fire(config) {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config }, bubbles: true, composed: true,
    }));
  }

  _update(key, value) {
    this._fire({ ...this._config, [key]: value });
  }

  _render() {
    if (!this._config || !this._hass) return;
    const c = this._config;

    // ── style ──
    const style = document.createElement('style');
    style.textContent = `
      *{box-sizing:border-box;margin:0;padding:0}
      :host{display:block;font-family:var(--primary-font-family,sans-serif);padding:4px 0}
      .section{margin-bottom:16px}
      .sec-title{font-size:11px;font-weight:600;color:var(--secondary-text-color);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid var(--divider-color)}
      .field{margin-bottom:10px}
      label{display:block;font-size:12px;color:var(--secondary-text-color);margin-bottom:4px;font-weight:500}
      input[type=text]{width:100%;padding:8px 10px;font-size:13px;background:var(--card-background-color);border:1px solid var(--divider-color);border-radius:6px;color:var(--primary-text-color);outline:none}
      input[type=text]:focus{border-color:var(--primary-color)}
      input[type=color]{width:100%;height:36px;padding:2px 4px;border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);cursor:pointer}
      .color-row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
      .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--divider-color,rgba(0,0,0,0.05))}
      .toggle-row:last-child{border-bottom:none}
      .tl{font-size:13px;color:var(--primary-text-color)}
      ha-switch{margin-left:8px}
      .range-row{display:flex;align-items:center;gap:8px;margin-top:12px}
      .range-row input[type=range]{flex:1;accent-color:var(--primary-color)}
      .rv{font-size:13px;font-weight:600;color:var(--primary-color);min-width:20px;text-align:right;font-family:monospace}
    `;

    // ── helper tạo field text input ──
    const mkText = (key, label, val) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = `<label>${label}</label>`;
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.dataset.key = key;
      inp.value = val ?? '';
      inp.addEventListener('change', e => this._update(key, e.target.value));
      wrap.appendChild(inp);
      return wrap;
    };

    // ── helper tạo ha-entity-picker ──
    const mkPicker = (key, label) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = `<label>${label}</label>`;
      const picker = document.createElement('ha-entity-picker');
      picker.hass = this._hass;
      picker.value = c[key] || '';
      picker.setAttribute('allow-custom-entity', '');
      picker.addEventListener('value-changed', e => {
        e.stopPropagation();
        this._update(key, e.detail.value);
      });
      wrap.appendChild(picker);
      return wrap;
    };

    // ── helper tạo toggle ──
    const mkToggle = (key, label) => {
      const row = document.createElement('div');
      row.className = 'toggle-row';
      const span = document.createElement('span');
      span.className = 'tl';
      span.textContent = label;
      const sw = document.createElement('ha-switch');
      sw.checked = c[key] !== false;
      sw.addEventListener('change', e => this._update(key, e.target.checked));
      row.appendChild(span);
      row.appendChild(sw);
      return row;
    };

    // ── helper tạo color input ──
    const mkColor = (key, label, val) => {
      const wrap = document.createElement('div');
      wrap.className = 'field';
      wrap.innerHTML = `<label>${label}</label>`;
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = val || '#000000';
      inp.addEventListener('input', e => this._update(key, e.target.value));
      wrap.appendChild(inp);
      return wrap;
    };

    // ── build DOM ──
    this.shadowRoot.innerHTML = '';
    this.shadowRoot.appendChild(style);

    // Section 1: entities
    const s1 = document.createElement('div');
    s1.className = 'section';
    s1.innerHTML = '<div class="sec-title">Thông tin chung</div>';
    s1.appendChild(mkText('name', 'Tên card', c.name));
    s1.appendChild(mkPicker('entity_level',       'Mực nước (%)'));
    s1.appendChild(mkPicker('entity_current',     'Dòng điện (A)'));
    s1.appendChild(mkPicker('entity_power',       'Công suất (W)'));
    s1.appendChild(mkPicker('entity_month',       'Điện tháng (kWh)'));
    s1.appendChild(mkPicker('entity_temperature', 'Nhiệt độ (°C)'));
    s1.appendChild(mkPicker('entity_water_day',   'Lượng nước / Ngày (L)'));
    s1.appendChild(mkPicker('entity_water_month', 'Lượng nước / Tháng (L)'));
    s1.appendChild(mkText('pump_threshold', 'Ngưỡng dòng điện bơm chạy (A)', c.pump_threshold ?? 0.5));
    this.shadowRoot.appendChild(s1);

    // Section 2: colors
    const s2 = document.createElement('div');
    s2.className = 'section';
    s2.innerHTML = '<div class="sec-title">Màu sắc</div>';
    const crow = document.createElement('div');
    crow.className = 'color-row';
    crow.appendChild(mkColor('color_water',  'Màu nước',    c.color_water  || '#29B6F6'));
    crow.appendChild(mkColor('color_bg',     'Nền card',    c.color_bg     || 'transparent'));
    crow.appendChild(mkColor('color_accent', 'Accent (kWh)',c.color_accent || '#FFD600'));
    s2.appendChild(crow);
    this.shadowRoot.appendChild(s2);

    // Section 3: display toggles
    const s3 = document.createElement('div');
    s3.className = 'section';
    s3.innerHTML = '<div class="sec-title">Hiển thị</div>';
    s3.appendChild(mkToggle('show_scan_line',      'Scan-line animation'));
    s3.appendChild(mkToggle('show_brand',          'Watermark SONHA'));
    s3.appendChild(mkToggle('show_wave',           'Sóng nước animation'));
    s3.appendChild(mkToggle('show_pump_animation', 'Bơm quay animation'));
    s3.appendChild(mkToggle('show_temperature',    'Hiện nhiệt độ'));

    // decimal range
    const rrow = document.createElement('div');
    rrow.className = 'range-row';
    rrow.innerHTML = `<label style="white-space:nowrap;font-size:12px;color:var(--secondary-text-color)">Số thập phân</label>`;
    const rng = document.createElement('input');
    rng.type = 'range'; rng.min = 0; rng.max = 4; rng.step = 1;
    rng.value = c.decimal_places ?? 2;
    const rv = document.createElement('span');
    rv.className = 'rv';
    rv.textContent = c.decimal_places ?? 2;
    rng.addEventListener('input', e => {
      rv.textContent = e.target.value;
      this._update('decimal_places', parseInt(e.target.value));
    });
    rrow.appendChild(rng);
    rrow.appendChild(rv);
    s3.appendChild(rrow);
    this.shadowRoot.appendChild(s3);

    this._rendered = true;
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────

customElements.define('water-tank-card',        WaterTankCard);
customElements.define('water-tank-card-editor', WaterTankCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type:        'water-tank-card',
  name:        'Water Tank Card',
  description: 'Hiển thị bể nước với animation sóng, bơm, mực nước realtime',
  preview:     true,
});
