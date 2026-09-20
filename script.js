(function () {
    'use strict';
    const STORAGE_KEY = 'lab1_variant12727_results';
    Decimal.set({precision: 100});

    const canvas = document.getElementById('plane');
    const ctx = canvas.getContext('2d');

    const form = document.getElementById('point-form');
    const xInput = document.getElementById('x-input');
    const yInput = document.getElementById('y-input');
    const rInputs = document.querySelectorAll('input[name="r"]');
    const xError = document.getElementById('x-error');
    const yError = document.getElementById('y-error');
    const rError = document.getElementById('r-error');
    const resultsBody = document.getElementById('results-body');

    const ALLOWED_Y = ['-4', '-3', '-2', '-1', '0', '1', '2', '3', '4'];
    const ALLOWED_R = ['1', '2', '3', '4', '5'];

    function isInsideRegion(xRaw, y, R) {
        const x = new Decimal(xRaw);
        const Rd = new Decimal(R);
        const yd = new Decimal(y);
        const halfR = Rd.div(2);

        const inRect = x.gte(halfR.negated()) && x.lte(0) && yd.gte(0) && yd.lte(Rd);
        const inQuarterCircle = x.gte(0) && yd.gte(0) && x.pow(2).plus(yd.pow(2)).lte(halfR.pow(2));
        const inTriangle = x.gte(0) && yd.lte(0) && x.minus(yd).lte(Rd);
        return inRect || inQuarterCircle || inTriangle;
    }

    function drawScene(R, points) {
        const w = canvas.width;
        const h = canvas.height;
        const cx = w / 2;
        const cy = h / 2;
        const range = 6;
        const scale = (w / 2 - 20) / range;

        function toPx(x, y) {
            return [cx + x * scale, cy - y * scale];
        }

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(52, 122, 194, 0.65)';
        ctx.strokeStyle = 'rgba(30, 80, 140, 0.9)';
        ctx.lineWidth = 1;

        ctx.beginPath();
        let p = toPx(-R / 2, 0);
        ctx.moveTo(p[0], p[1]);
        p = toPx(0, 0);
        ctx.lineTo(p[0], p[1]);
        p = toPx(0, R);
        ctx.lineTo(p[0], p[1]);
        p = toPx(-R / 2, R);
        ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        p = toPx(0, 0);
        ctx.moveTo(p[0], p[1]);
        for (let deg = 0; deg <= 90; deg += 2) {
            const rad = (deg * Math.PI) / 180;
            const px = (R / 2) * Math.cos(rad);
            const py = (R / 2) * Math.sin(rad);
            p = toPx(px, py);
            ctx.lineTo(p[0], p[1]);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        p = toPx(0, 0);
        ctx.moveTo(p[0], p[1]);
        p = toPx(R, 0);
        ctx.lineTo(p[0], p[1]);
        p = toPx(0, -R);
        ctx.lineTo(p[0], p[1]);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#333333';
        ctx.fillStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.font = '11px Arial';

        ctx.beginPath();
        ctx.moveTo(10, cy);
        ctx.lineTo(w - 10, cy);
        ctx.moveTo(cx, h - 10);
        ctx.lineTo(cx, 10);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(w - 10, cy);
        ctx.lineTo(w - 18, cy - 4);
        ctx.lineTo(w - 18, cy + 4);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx, 10);
        ctx.lineTo(cx - 4, 18);
        ctx.lineTo(cx + 4, 18);
        ctx.closePath();
        ctx.fill();

        ctx.fillText('x', w - 16, cy - 8);
        ctx.fillText('y', cx + 8, 16);

        function fmt(v) {
            return Number.isInteger(v) ? String(v) : v.toFixed(1);
        }

        const marks = [
            {v: R, label: fmt(R)},
            {v: R / 2, label: fmt(R / 2)},
            {v: -R / 2, label: fmt(-R / 2)},
            {v: -R, label: fmt(-R)}
        ];
        marks.forEach(function (m) {
            let pt = toPx(m.v, 0);
            ctx.beginPath();
            ctx.moveTo(pt[0], cy - 3);
            ctx.lineTo(pt[0], cy + 3);
            ctx.stroke();
            ctx.fillText(m.label, pt[0] - 10, cy + 15);

            pt = toPx(0, m.v);
            ctx.beginPath();
            ctx.moveTo(cx - 3, pt[1]);
            ctx.lineTo(cx + 3, pt[1]);
            ctx.stroke();
            ctx.fillText(m.label, cx + 6, pt[1] + 4);
        });

        points.forEach(function (pt) {
            if (Number(pt.r) !== Number(R)) return;
            const px = toPx(parseFloat(pt.x), pt.y);
            ctx.beginPath();
            ctx.arc(px[0], px[1], 4, 0, Math.PI * 2);
            ctx.fillStyle = pt.hit ? '#1e7e34' : '#c0392b';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    function loadResults() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveResults(results) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    }

    function formatDateTime(isoString) {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    function renderResults(results) {
        resultsBody.innerHTML = '';
        results.forEach(function (r) {
            const tr = document.createElement('tr');
            const tdX = document.createElement('td');
            tdX.textContent = r.x;
            const tdY = document.createElement('td');
            tdY.textContent = r.y;
            const tdR = document.createElement('td');
            tdR.textContent = r.r;
            const tdHit = document.createElement('td');
            tdHit.textContent = r.hit ? 'Попадание' : 'Мимо';
            tdHit.className = r.hit ? 'hit-yes' : 'hit-no';
            const tdDate = document.createElement('td');
            tdDate.textContent = formatDateTime(r.timestamp);

            tr.appendChild(tdX);
            tr.appendChild(tdY);
            tr.appendChild(tdR);
            tr.appendChild(tdHit);
            tr.appendChild(tdDate);
            resultsBody.appendChild(tr);
        });
    }

    function getSelectedR() {
        for (const el of rInputs) {
            if (el.checked) return el.value;
        }
        return null;
    }

    function validate() {
        let valid = true;

        xInput.classList.remove('invalid');
        xError.textContent = '';

        const xRaw = xInput.value.trim().replace(',', '.');
        let xOk = xRaw !== '';
        if (xOk) {
            try {
                const xDec = new Decimal(xRaw);
                xOk = xDec.gte(-3) && xDec.lte(3);
            } catch (e) {
                xOk = false;
            }
        }
        if (!xOk) {
            xInput.classList.add('invalid');
            xError.textContent = 'X должен быть числом от -3 до 3';
            valid = false;
        }

        yError.textContent = '';
        if (!ALLOWED_Y.includes(yInput.value)) {
            yError.textContent = 'Недопустимое значение Y';
            valid = false;
        }

        rError.textContent = '';
        const rVal = getSelectedR();
        if (rVal === null || !ALLOWED_R.includes(rVal)) {
            rError.textContent = 'Недопустимое значение R';
            valid = false;
        }

        return valid;
    }

    xInput.addEventListener('input', function () {
        let v = xInput.value;
        v = v.replace(/[^0-9,.\-]/g, '');
        v = v.replace(/(?!^)-/g, '');
        const parts = v.split(/[.,]/);
        if (parts.length > 2) {
            v = parts[0] + '.' + parts.slice(1).join('');
        }
        xInput.value = v;
    });

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (!validate()) return;

        const xRaw = xInput.value.trim().replace(',', '.');
        const y = Number(yInput.value);
        const R = Number(getSelectedR());
        const hit = isInsideRegion(xRaw, y, R);

        const results = loadResults();
        results.push({
            x: xRaw,
            y: y,
            r: R,
            hit: hit,
            timestamp: new Date().toISOString()
        });
        saveResults(results);

        renderResults(results);
        drawScene(R, results);
    });

    rInputs.forEach(function (el) {
        el.addEventListener('change', function () {
            const rVal = getSelectedR();
            if (!ALLOWED_R.includes(rVal)) {
                rError.textContent = 'Недопустимое значение R';
                return;
            }
            rError.textContent = '';
            drawScene(Number(rVal), loadResults());
        });
    });

    const initialResults = loadResults();
    renderResults(initialResults);
    drawScene(Number(getSelectedR()) || 1, initialResults);
})();