// ═══════════════════════════════════════════════════════════════════
//  VAAKYA PANCHANGAM LIBRARY
//  Astronomical engine: Jean Meeus "Astronomical Algorithms"
//  Sidereal frame    : Lahiri / Chitra Paksha ayanamsha
//  Input timezone    : IST (UTC +5:30)
//
//  UMD module — works in browsers (window.PanchangamLib) and Node.js
//  (require('./panchangam-lib')).
// ═══════════════════════════════════════════════════════════════════

/* global module */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.PanchangamLib = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // ── Utility ─────────────────────────────────────────────────────────
  function norm(a) { return ((a % 360) + 360) % 360; }
  var R = Math.PI / 180;

  // ── Gregorian date + UTC time → Julian Day Number ──────────────────
  function gregorianToJD(yr, mo, dy, hr, mn) {
    var y = yr, m = mo;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100);
    var B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25 * (y + 4716))
         + Math.floor(30.6001 * (m + 1))
         + dy + B - 1524.5
         + (hr + mn / 60) / 24;
  }

  // ── Sun tropical longitude (Jean Meeus Ch. 25, ~0.01° accuracy) ────
  function sunTropical(jd) {
    var T = (jd - 2451545.0) / 36525.0;
    var L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    var M  = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
    var Mr = M * R;
    var C  = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
           + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
           + 0.000289 * Math.sin(3 * Mr);
    var lon = L0 + C;
    // Apparent: subtract nutation + aberration (approx)
    var Omega = norm(125.04 - 1934.136 * T);
    lon -= 0.00569 + 0.00478 * Math.sin(Omega * R);
    return norm(lon);
  }

  // ── Moon tropical longitude (Jean Meeus Ch. 47, ~0.1° accuracy) ────
  function moonTropical(jd) {
    var T  = (jd - 2451545.0) / 36525.0;
    var T2 = T * T, T3 = T2 * T, T4 = T3 * T;

    var Lp = norm(218.3164477 + 481267.88123421*T - 0.0015786*T2 + T3/538841    - T4/65194000);
    var D  = norm(297.8501921 + 445267.1114034 *T - 0.0018819*T2 + T3/545868    - T4/113065000);
    var M  = norm(357.5291092 + 35999.0502909  *T - 0.0001536*T2 + T3/24490000);
    var Mp = norm(134.9633964 + 477198.8675055 *T + 0.0087414*T2 + T3/69699     - T4/14712000);
    var F  = norm(93.2720950  + 483202.0175233 *T - 0.0036539*T2 - T3/3526000   + T4/863310000);

    var E  = 1 - 0.002516 * T - 0.0000074 * T2;
    var E2 = E * E;

    // Σl terms (degrees) – Table 47.A, top 40 terms
    var SL = 0;
    function add(d, m, mp, f, c) {
      SL += c * Math.sin((d*D + m*M + mp*Mp + f*F) * R);
    }
    add(0, 0, 1, 0,  6.288774);
    add(2, 0,-1, 0,  1.274027);
    add(2, 0, 0, 0,  0.658314);
    add(0, 0, 2, 0,  0.213618);
    add(0,-1, 0, 0, -0.185116 * E);
    add(0, 0, 0, 2, -0.114332);
    add(2, 0,-2, 0,  0.058793);
    add(2,-1,-1, 0,  0.057066 * E);
    add(2, 0, 1, 0,  0.053322);
    add(2,-1, 0, 0,  0.045758 * E);
    add(0, 1,-1, 0, -0.040923 * E);
    add(1, 0, 0, 0, -0.034720);
    add(0, 1, 1, 0, -0.030383 * E);
    add(2, 0, 0,-2,  0.015327);
    add(0, 0, 1, 2, -0.012528);
    add(0, 0, 1,-2,  0.010980);
    add(4, 0,-1, 0,  0.010675);
    add(0, 0, 3, 0,  0.010034);
    add(4, 0,-2, 0,  0.008548);
    add(2, 1,-1, 0, -0.007888 * E);
    add(2, 1, 0, 0, -0.006766 * E);
    add(1, 0,-1, 0, -0.005163);
    add(1, 1, 0, 0,  0.004987 * E);
    add(2,-1, 1, 0,  0.004036 * E);
    add(2, 0, 2, 0,  0.003994);
    add(4, 0, 0, 0,  0.003861);
    add(2, 0,-3, 0,  0.003665);
    add(0, 1,-2, 0, -0.002689 * E);
    add(2, 0,-1, 2, -0.002602);
    add(2,-1,-2, 0,  0.002390 * E);
    add(1, 0, 1, 0, -0.002348);
    add(2,-2, 0, 0,  0.002236 * E2);
    add(0, 1, 2, 0, -0.002120 * E);
    add(0, 2, 0, 0, -0.002069 * E2);
    add(2,-2,-1, 0,  0.002048 * E2);
    add(2, 0, 1,-2, -0.001773);
    add(2, 0, 0, 2, -0.001595);
    add(4,-1,-1, 0,  0.001215 * E);
    add(0, 0, 2, 2, -0.001110);
    add(3, 0,-1, 0, -0.000892);
    add(2, 1, 1, 0, -0.000810 * E);
    add(4,-1,-2, 0,  0.000759 * E);
    add(0, 2,-1, 0, -0.000713 * E2);
    add(2, 2,-1, 0, -0.000700 * E2);
    add(2, 1,-2, 0,  0.000691 * E);
    add(2,-1, 0,-2,  0.000596 * E);
    add(4, 0, 1, 0,  0.000549);
    add(0, 0, 4, 0,  0.000537);
    add(4,-1, 0, 0,  0.000520 * E);
    add(1, 0,-2, 0, -0.000487);

    return norm(Lp + SL);
  }

  // ── Lahiri ayanamsha (degrees) ──────────────────────────────────────
  // Calibrated so that 15 Sep 2022 gives ~23.967°, verified against
  // published South Indian panchangam values.
  function lahiriAyanamsha(jd) {
    return 23.65 + 0.013969722 * (jd - 2451545.0) / 365.25;
  }

  // ── Format sidereal longitude for display ──────────────────────────
  var RASHI_EN = ['Mesha ♈','Vrishabha ♉','Mithuna ♊','Karka ♋',
                  'Simha ♌','Kanya ♍','Tula ♎','Vrischika ♏',
                  'Dhanu ♐','Makara ♑','Kumbha ♒','Meena ♓'];
  function fmtLon(deg) {
    var ri  = Math.floor(deg / 30);
    var inR = deg % 30;
    var d   = Math.floor(inR);
    var m   = Math.floor((inR - d) * 60);
    var s   = Math.floor(((inR - d) * 60 - m) * 60);
    return (RASHI_EN[ri] || '') + '  ' + d + '° ' + m + "' " + s + '"  (' + deg.toFixed(3) + '°)';
  }

  // ── Days in a Gregorian month ───────────────────────────────────────
  function daysInMonth(y, m) { return new Date(y, m, 0).getDate(); }

  // ── Name tables ─────────────────────────────────────────────────────
  var VARA_TA = ['ஞாயிறு','திங்கள்','செவ்வாய்','புதன்','வியாழன்','வெள்ளி','சனி'];
  var VARA_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  var TITHI_TA = ['பிரதமை','துவிதியை','திருதியை','சதுர்த்தி','பஞ்சமி',
                  'சஷ்டி','சப்தமி','அஷ்டமி','நவமி','தசமி',
                  'ஏகாதசி','துவாதசி','திரயோதசி','சதுர்தசி'];
  var TITHI_EN = ['Pratipat','Dvitiya','Tritiya','Chaturthi','Panchami',
                  'Shashthi','Saptami','Ashtami','Navami','Dashami',
                  'Ekadashi','Dvadashi','Trayodashi','Chaturdashi'];

  var NAKSHATRA_TA = ['அஸ்வினி','பரணி','கிருத்திகை','ரோஹிணி','மிருகசீரிடம்',
    'திருவாதிரை','புனர்பூசம்','பூசம்','ஆயில்யம்','மகம்',
    'பூரம்','உத்திரம்','ஹஸ்தம்','சித்திரை','சுவாதி',
    'விசாகம்','அனுஷம்','கேட்டை','மூலம்','பூராடம்',
    'உத்திராடம்','திருவோணம்','அவிட்டம்','சதயம்',
    'பூரட்டாதி','உத்திரட்டாதி','ரேவதி'];
  var NAKSHATRA_EN = ['Ashwini','Bharani','Krittika','Rohini','Mrigashirsha',
    'Ardra','Punarvasu','Pushya','Ashlesha','Magha',
    'Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati',
    'Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha',
    'Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha',
    'Purva Bhadrapada','Uttara Bhadrapada','Revati'];

  var YOGA_TA = ['விஷ்கம்பம்','ப்ரீதி','ஆயுஷ்மான்','சௌபாக்யம்','சோபனம்',
    'அதிகண்டம்','சுகர்மம்','திருதி','சூலம்','கண்டம்',
    'வ்ருத்தி','துருவம்','வ்யாகாதம்','ஹர்ஷணம்','வஜ்ரம்',
    'சித்தி','வ்யதீபாதம்','வரீயான்','பரிகம்','சிவம்',
    'சித்தம்','சாத்யம்','சுபம்','சுக்லம்','ப்ரஹ்மம்',
    'இந்திரம்','வைத்ருதி'];
  var YOGA_EN = ['Vishkambha','Priti','Ayushman','Saubhagya','Shobhana',
    'Atiganda','Sukarman','Dhriti','Shula','Ganda',
    'Vriddhi','Dhruva','Vyaghata','Harshana','Vajra',
    'Siddhi','Vyatipata','Variyan','Parigha','Shiva',
    'Siddha','Sadhya','Shubha','Shukla','Brahma',
    'Indra','Vaidhriti'];

  var KARANA_MOV_TA = ['பவம்','பாலவம்','கௌலவம்','தைதிலம்','கரஜம்','வணிஜம்','விஷ்டி'];
  var KARANA_MOV_EN = ['Bava','Balava','Kaulava','Taitila','Gara','Vanija','Vishti (Bhadra)'];

  var MASA_TA = ['சித்திரை','வைகாசி','ஆனி','ஆடி','ஆவணி','புரட்டாசி',
                 'ஐப்பசி','கார்த்திகை','மார்கழி','தை','மாசி','பங்குனி'];
  var MASA_EN = ['Chithirai','Vaigasi','Aani','Aadi','Aavani','Purattasi',
                 'Aippasi','Karthigai','Margazhi','Thai','Maasi','Panguni'];

  var SAMVATSARA_TA = [
    'ப்ரபவ','விபவ','சுக்ல','ப்ரமோதூத','ப்ரஜோத்பத்தி','ஆங்கீரஸ',
    'ஸ்ரீமுக','பவ','யுவ','தாது','ஈஸ்வர','பஹுதான்ய',
    'ப்ரமாதி','விக்ரம','வ்ருஷ','சித்ரபானு','சுபானு','தாரண',
    'பார்த்திவ','வ்யயா','சர்வஜித்','சர்வதாரி','விரோதி','விக்ருதி',
    'கர','நந்தன','விஜய','ஜய','மன்மத','துர்முகி',
    'ஹேவிளம்பி','விளம்பி','விகாரி','சார்வரி','ப்லவ','சுபக்ருது',
    'சோபக்ருது','க்ரோதி','விஸ்வாவசு','பராபவ','ப்லவங்க','கீலக',
    'சௌம்ய','சாதாரண','விரோதக்ருது','பரிதாபி','ப்ரமாதீச','ஆனந்த',
    'ராக்ஷஸ','நல','பிங்கள','காளயுக்தி','சித்தார்த்தி','ரௌத்ர',
    'துர்மதி','துந்துபி','ருத்ரோத்காரி','ரக்தாக்ஷி','க்ரோதன','அக்ஷய'
  ];

  // ── Karana name (position 0–59 in the lunar month) ─────────────────
  function karanaName(pos) {
    if (pos === 0)  return { ta: 'கிம்ஸ்துக்னம்', en: 'Kimstughna' };
    if (pos === 57) return { ta: 'சகுனி',          en: 'Shakuni' };
    if (pos === 58) return { ta: 'சதுஷ்பாதம்',     en: 'Chatushpada' };
    if (pos === 59) return { ta: 'நாகவம்',          en: 'Naga' };
    var i = (pos - 1) % 7;
    return { ta: KARANA_MOV_TA[i], en: KARANA_MOV_EN[i] };
  }

  // ── Tithi names (index 0–29) ────────────────────────────────────────
  function tithiTa(idx) {
    if (idx === 14) return 'பௌர்ணமி';
    if (idx === 29) return 'அமாவாசை';
    return TITHI_TA[idx < 15 ? idx : idx - 15];
  }
  function tithiEn(idx) {
    if (idx === 14) return 'Purnima (Full Moon)';
    if (idx === 29) return 'Amavasya (New Moon)';
    return TITHI_EN[idx < 15 ? idx : idx - 15];
  }

  // ── Per-JD index helpers (used for transition search) ───────────────
  function tithiIdxAt(jd) {
    var ay    = lahiriAyanamsha(jd);
    var sunS  = norm(sunTropical(jd)  - ay);
    var moonS = norm(moonTropical(jd) - ay);
    return Math.floor(norm(moonS - sunS) / 12);
  }
  function nakshatraIdxAt(jd) {
    var ay    = lahiriAyanamsha(jd);
    var moonS = norm(moonTropical(jd) - ay);
    return Math.floor(moonS / (360 / 27));
  }
  function yogaIdxAt(jd) {
    var ay    = lahiriAyanamsha(jd);
    var sunS  = norm(sunTropical(jd)  - ay);
    var moonS = norm(moonTropical(jd) - ay);
    return Math.floor(norm(sunS + moonS) / (360 / 27));
  }
  function karanaPosAt(jd) {
    var ay    = lahiriAyanamsha(jd);
    var sunS  = norm(sunTropical(jd)  - ay);
    var moonS = norm(moonTropical(jd) - ay);
    return Math.floor(norm(moonS - sunS) / 6);
  }

  // ── Transition-finding via step + bisection ──────────────────────────
  // Returns JD when the element last changed TO its current value.
  function findPrevTransition(jd, idxFn) {
    var target = idxFn(jd);
    var step   = 1 / 24; // 1 hour
    var cur    = jd - step;
    for (var i = 0; i < 48; i++) {
      if (idxFn(cur) !== target) {
        // Transition between cur and cur+step → bisect
        var lo = cur, hi = cur + step;
        for (var j = 0; j < 42; j++) {
          var mid = (lo + hi) / 2;
          if (idxFn(mid) === target) hi = mid; else lo = mid;
        }
        return hi;
      }
      cur -= step;
    }
    return null; // fallback: not found within 48 hours
  }

  // Returns JD when the element will next change away from its current value.
  function findNextTransition(jd, idxFn) {
    var target = idxFn(jd);
    var step   = 1 / 24;
    var cur    = jd + step;
    for (var i = 0; i < 48; i++) {
      if (idxFn(cur) !== target) {
        var lo = cur - step, hi = cur;
        for (var j = 0; j < 42; j++) {
          var mid = (lo + hi) / 2;
          if (idxFn(mid) === target) lo = mid; else hi = mid;
        }
        return hi;
      }
      cur += step;
    }
    return null;
  }

  // ── JD → IST datetime object ─────────────────────────────────────────
  // JD 2440587.5 = 1970-01-01 00:00:00 UTC
  var _IST_OFFSET_MS = 330 * 60000; // 5h30m in ms
  var _UNIX_EPOCH_JD = 2440587.5;
  var _MON3 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function jdToIST(jd) {
    var ms = (jd - _UNIX_EPOCH_JD) * 86400000 + _IST_OFFSET_MS;
    var d  = new Date(ms);
    return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1,
             day: d.getUTCDate(), hour: d.getUTCHours(), min: d.getUTCMinutes() };
  }

  function fmtISTdt(t) {
    var h = t.hour, ap = h < 12 ? 'AM' : 'PM';
    h = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return _MON3[t.month - 1] + ' ' + t.day + ', ' + h + ':' + String(t.min).padStart(2,'0') + ' ' + ap;
  }

  // Format an active-period range string; null JDs show as "—"
  function fmtRange(jdStart, jdEnd) {
    var s = jdStart ? fmtISTdt(jdToIST(jdStart)) : '—';
    var e = jdEnd   ? fmtISTdt(jdToIST(jdEnd))   : '—';
    return s + ' → ' + e + ' IST';
  }

  // ── IST date string + IST time string → JD ──────────────────────────
  // (shared by computePanchangam and internal helpers)
  function istToJD(dateStr, timeStr) {
    var dp = dateStr.split('-');
    var inputYear  = parseInt(dp[0], 10);
    var inputMonth = parseInt(dp[1], 10);
    var inputDay   = parseInt(dp[2], 10);

    var tp  = (timeStr || '06:00').split(':');
    var istH = parseInt(tp[0], 10);
    var istM = parseInt(tp[1], 10);

    // IST → UTC (subtract 5 h 30 m)
    var utcM = istM - 30, utcH = istH - 5;
    var utcD = inputDay, utcMo = inputMonth, utcY = inputYear;
    if (utcM < 0) { utcM += 60; utcH -= 1; }
    if (utcH < 0) {
      utcH += 24; utcD -= 1;
      if (utcD < 1) {
        utcMo -= 1;
        if (utcMo < 1) { utcMo = 12; utcY -= 1; }
        utcD = daysInMonth(utcY, utcMo);
      }
    }
    return gregorianToJD(utcY, utcMo, utcD, utcH, utcM);
  }

  // ── Core computation ─────────────────────────────────────────────────
  /**
   * Compute raw panchangam data for a given IST date and time.
   *
   * @param {string} dateStr  - 'YYYY-MM-DD' in IST
   * @param {string} [timeStr] - 'HH:MM' in IST (defaults to '06:00')
   * @returns {object} Raw result with indices and astronomical values.
   */
  function computePanchangam(dateStr, timeStr) {
    var dp = dateStr.split('-');
    var inputYear  = parseInt(dp[0], 10);
    var inputMonth = parseInt(dp[1], 10);

    var jd = istToJD(dateStr, timeStr);
    var ay = lahiriAyanamsha(jd);

    // Sidereal longitudes
    var sunS  = norm(sunTropical(jd)  - ay);
    var moonS = norm(moonTropical(jd) - ay);

    // ── Vara (weekday) ── 0=Sun … 6=Sat
    var vara = Math.floor(jd + 1.5) % 7;

    // ── Tithi ── (Moon – Sun) / 12°  → index 0–29
    var msd      = norm(moonS - sunS);
    var tithiIdx = Math.floor(msd / 12);

    // ── Nakshatra ── Moon / (360/27) → 0–26
    var nakshatraIdx = Math.floor(moonS / (360 / 27));

    // ── Yoga ── (Sun + Moon) / (360/27) → 0–26
    var yogaIdx = Math.floor(norm(sunS + moonS) / (360 / 27));

    // ── Karana ── every 6° of msd → position 0–59
    var karanaPos = Math.floor(msd / 6);

    // ── Solar month (Masa) ── Sun rashi 0–11
    var masaIdx = Math.floor(sunS / 30);

    // ── Samvatsara (60-year cycle) ──
    // Reference: Tamil year 2022 (after Apr 14) = Subhakrit (index 35).
    // Formula verified for 2022–2025.
    var civilYear     = (inputMonth >= 4) ? inputYear : inputYear - 1;
    var samvatsaraIdx = ((civilYear + 3102 + 11) % 60 + 60) % 60;

    return {
      jd: jd, ay: ay,
      sunS: sunS, moonS: moonS,
      vara: vara,
      tithiIdx: tithiIdx,
      paksha: tithiIdx < 15
                ? 'சுக்ல பக்ஷம் (Shukla / Waxing)'
                : 'கிருஷ்ண பக்ஷம் (Krishna / Waning)',
      nakshatraIdx: nakshatraIdx,
      yogaIdx: yogaIdx,
      karanaPos: karanaPos,
      masaIdx: masaIdx,
      samvatsaraIdx: samvatsaraIdx
    };
  }

  // ── Day's Panchangam at sunrise ──────────────────────────────────────
  /**
   * Return a structured panchangam object for the day at sunrise (~6 AM IST).
   * This is the canonical "Day's Panchangam" used by traditional almanacs.
   *
   * @param {string} dateStr - 'YYYY-MM-DD' in IST
   * @returns {object} Structured panchangam with named Tamil/English values.
   *
   * Example return value:
   * {
   *   vara:        { index: 0, ta: 'ஞாயிறு',   en: 'Sunday' },
   *   tithi:       { index: 29, ta: 'அமாவாசை', en: 'Amavasya (New Moon)' },
   *   paksha:      'கிருஷ்ண பக்ஷம் (Krishna / Waning)',
   *   nakshatra:   { index: 3, ta: 'ரோஹிணி',   en: 'Rohini' },
   *   yoga:        { index: 5, ta: 'அதிகண்டம்', en: 'Atiganda' },
   *   karana:      { pos: 59, ta: 'நாகவம்',     en: 'Naga' },
   *   masa:        { index: 5, ta: 'புரட்டாசி', en: 'Purattasi' },
   *   samvatsara:  { index: 35, ta: 'சுபக்ருது' },
   *   jd:          2460000.25,
   *   ayanamsha:   23.97,
   *   sunSidereal: 152.34,
   *   moonSidereal: 45.67,
   *   isShannavathiTharppana: false,
   *   shannavathiReasons: []
   * }
   */
  function getDayPanchangam(dateStr) {
    var r  = computePanchangam(dateStr, '06:00');
    var k  = karanaName(r.karanaPos);
    var sh = isShannavathiTharppana(dateStr);

    return {
      vara:       { index: r.vara,         ta: VARA_TA[r.vara],               en: VARA_EN[r.vara] },
      tithi:      { index: r.tithiIdx,     ta: tithiTa(r.tithiIdx),          en: tithiEn(r.tithiIdx) },
      paksha:     r.paksha,
      nakshatra:  { index: r.nakshatraIdx, ta: NAKSHATRA_TA[r.nakshatraIdx], en: NAKSHATRA_EN[r.nakshatraIdx] },
      yoga:       { index: r.yogaIdx,      ta: YOGA_TA[r.yogaIdx],           en: YOGA_EN[r.yogaIdx] },
      karana:     { pos: r.karanaPos,      ta: k.ta,                         en: k.en },
      masa:       { index: r.masaIdx,      ta: MASA_TA[r.masaIdx],           en: MASA_EN[r.masaIdx] },
      samvatsara: { index: r.samvatsaraIdx, ta: SAMVATSARA_TA[r.samvatsaraIdx] },
      jd:          r.jd,
      ayanamsha:   r.ay,
      sunSidereal:  r.sunS,
      moonSidereal: r.moonS,
      isShannavathiTharppana: sh.isTharppana,
      shannavathiReasons:     sh.reasons
    };
  }

  // ── Shannavathi (96) Tharpanam day check ────────────────────────────
  // Named constants for the Mahalaya Paksha check
  var _PURATTASI_MASA_IDX  = 5;  // Kanya rashi (Purattasi solar month)
  var _KRISHNA_PAKSHA_START = 15; // tithiIdx where Krishna Paksha begins
  var _SANKRANTI_CHECK_TIME = '23:30'; // IST time used to detect same-day solar ingress

  /**
   * Determine whether a given date is a Shannavathi Tharpanam day.
   *
   * The Shannavathi (96) Tharpanam days are a set of annually recurring
   * dates considered ideal for Pitru Tarpana (ancestral oblations).
   * This function identifies the algorithmically computable categories:
   *
   *   1. Amavasai      – New Moon (Tithi index 29)
   *   2. Vyatipata     – Yoga index 16
   *   3. Vaidhriti     – Yoga index 26
   *   4. Sankranti     – Sun crosses a rashi boundary during the day
   *   5. Mahalaya Paksha – Krishna Paksha (tithiIdx ≥ 15) during
   *                        Purattasi / Kanya solar month (masaIdx = 5)
   *
   * Note: Manvadi (14/yr), Yugadi (4/yr), and eclipse days require
   * additional calendar data and are not included here.
   *
   * @param {string} dateStr - 'YYYY-MM-DD' in IST
   * @returns {{ isTharppana: boolean, reasons: Array<{ta: string, en: string}> }}
   */
  function isShannavathiTharppana(dateStr) {
    var r        = computePanchangam(dateStr, '06:00');
    var rEvening = computePanchangam(dateStr, _SANKRANTI_CHECK_TIME);
    var reasons  = [];

    // 1. Amavasai (New Moon)
    if (r.tithiIdx === 29) {
      reasons.push({ ta: 'அமாவாசை', en: 'Amavasai (New Moon)' });
    }

    // 2. Vyatipata Yoga
    if (r.yogaIdx === 16) {
      reasons.push({ ta: 'வ்யதீபாதம் யோகம்', en: 'Vyatipata Yoga' });
    }

    // 3. Vaidhriti Yoga
    if (r.yogaIdx === 26) {
      reasons.push({ ta: 'வைத்ருதி யோகம்', en: 'Vaidhriti Yoga' });
    }

    // 4. Sankranti – Sun transitions to a new rashi during the day
    if (r.masaIdx !== rEvening.masaIdx) {
      var newMasaIdx = rEvening.masaIdx;
      reasons.push({
        ta: MASA_TA[newMasaIdx] + ' சங்கிராந்தி',
        en: MASA_EN[newMasaIdx] + ' Sankranti (Solar Ingress)'
      });
    }

    // 5. Mahalaya Paksha – Krishna Paksha during Purattasi (Kanya solar month)
    if (r.masaIdx === _PURATTASI_MASA_IDX && r.tithiIdx >= _KRISHNA_PAKSHA_START) {
      reasons.push({ ta: 'மஹாலய பக்ஷம்', en: 'Mahalaya Paksha' });
    }

    return { isTharppana: reasons.length > 0, reasons: reasons };
  }

  // ── Public API ───────────────────────────────────────────────────────
  return {
    // Core computation
    computePanchangam:      computePanchangam,
    getDayPanchangam:       getDayPanchangam,
    isShannavathiTharppana: isShannavathiTharppana,

    // Name tables
    VARA_TA:        VARA_TA,
    VARA_EN:        VARA_EN,
    TITHI_TA:       TITHI_TA,
    TITHI_EN:       TITHI_EN,
    NAKSHATRA_TA:   NAKSHATRA_TA,
    NAKSHATRA_EN:   NAKSHATRA_EN,
    YOGA_TA:        YOGA_TA,
    YOGA_EN:        YOGA_EN,
    KARANA_MOV_TA:  KARANA_MOV_TA,
    KARANA_MOV_EN:  KARANA_MOV_EN,
    MASA_TA:        MASA_TA,
    MASA_EN:        MASA_EN,
    SAMVATSARA_TA:  SAMVATSARA_TA,
    RASHI_EN:       RASHI_EN,

    // Name helpers
    tithiTa:   tithiTa,
    tithiEn:   tithiEn,
    karanaName: karanaName,

    // Formatting utilities
    fmtLon:    fmtLon,
    fmtRange:  fmtRange,
    jdToIST:   jdToIST,
    fmtISTdt:  fmtISTdt,

    // Per-JD index helpers (for transition search)
    tithiIdxAt:    tithiIdxAt,
    nakshatraIdxAt: nakshatraIdxAt,
    yogaIdxAt:     yogaIdxAt,
    karanaPosAt:   karanaPosAt,

    // Transition finders
    findPrevTransition: findPrevTransition,
    findNextTransition: findNextTransition
  };
}));
