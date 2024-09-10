// Copyright 2024 0xDEADFED5
const el_terminal = document.getElementById('terminal');
let term = null;
let cast_time = [];
let cast_code = [];
let cast_data = [];
let cast_header = '';
let index = 0;
let cast_len = 0;
let play_start = 0;
let playing = false;
let interval_id = 0;
let pause_time = null;

async function parse_cast(data) {
    const lines = data.split('\n');
    cast_time = new Array(lines.length - 1);
    cast_code = new Array(lines.length - 1);
    cast_data = new Array(lines.length - 1);
    cast_len = lines.length - 1;
    try {
        cast_header = JSON.parse(lines[0]);
        console.log(cast_header);
        let line = '';
        for (let x = 1; x < lines.length; x++) {
            line = JSON.parse(lines[x]);
            if (line.length === 3) {
                cast_time[x - 1] = line[0];
                cast_code[x - 1] = line[1];
                cast_data[x - 1] = line[2];
            }
        }
        cast_parsed = true;
    } catch (e) {
        alert('Malformed asciicast file!');
        return false;
    }
    return true;
}

async function render_lines() {
    const elapsed = (Date.now() - play_start) / 1000;
    let buffer = '';
    while (playing) {
        if (index === cast_len) {
            if (buffer !== '') {
                term.write(buffer);
            }
            console.log('fin')
            clearInterval(interval_id);
            document.getElementById('play_button').innerHTML = 'Replay';
            index = 0;
            pause_time = null;
            playing = false;
            return;
        }
        if (elapsed >= cast_time[index]) {
            if (cast_code[index] !== 'm') {
                buffer += cast_data[index];
                index += 1;
            } else {
                index += 1;
            }
        } else {
            if (buffer !== '') {
                term.write(buffer);
            }
            return;
        }
    }
}

async function play_cast() {
    term.clear();
    play_start = Date.now();
    playing = true;
    interval_id = setInterval(render_lines, 3);
}

function saveBlob(filename, data) {
    const blob = new Blob([data], {type: 'application/octet-stream'});
    if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, filename);
    } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
    }
}

async function download(id) {
    const response = await fetch('/download?id=' + id);
    document.getElementById('title').innerHTML = '<br>Downloading ... ';
    if (response.status !== 200) {
        document.getElementById('title').innerHTML = '<br>Download failed';
        return false;
    }
    return await response.json();
}

async function onPlay(e) {
    if (!playing) {
        if (pause_time !== null) {
            playing = true;
            const elapsed = Date.now() - pause_time;
            play_start += elapsed;
            interval_id = setInterval(render_lines, 3);
            document.getElementById('play_button').innerHTML = 'Pause';
            return;
        }
        const pic = document.getElementById('pic');
        if (pic) {
            pic.remove();
        }
        if (term === null) {
            await init_term();
        }
        document.getElementById('play_button').innerHTML = 'Pause';
        await play_cast();
    } else {
        playing = false;
        pause_time = Date.now();
        document.getElementById('play_button').innerHTML = 'Resume';
    }
}

async function getTextWidth(count, font) {
    const text = 'W'.repeat(count);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(text);
    return metrics.width;
}

const fitAddon = new FitAddon.FitAddon();

async function getMaxTextSize() {
    let width = 0;
    for (let x = 15; x > 5; x--) {
        width = await getTextWidth(cast_header.width, x.toString() + 'px Fira Code');
        if (width < window.innerWidth) {
            return [x, width];
        }
    }
    return [5, await getTextWidth(cast_header.width, '5px Fira Code')];
}

async function onTermResize(e) {
    fitAddon.fit();
}

async function init_term() {
    if (term != null) {
        term.dispose();
    }
    const weblinksAddon = new WebLinksAddon.WebLinksAddon();
    const webglAddon = new WebglAddon.WebglAddon();
    webglAddon.onContextLoss(e => {
        webglAddon.dispose();
    });
    let cols = 80;
    let rows = 24;
    if (cast_header !== '') {
        if (cast_header.width && cast_header.height) {
            cols = cast_header.width;
            rows = cast_header.height;
        }
    }
    let fontSize = 16;
    let width = await getTextWidth(cast_header.width, '16px Fira Code');
    if (width > window.innerWidth) {
        const res = await getMaxTextSize();
        fontSize = res[0];
        width = res[1];
    }
    el_terminal.style.width = width.toString() + "px";
    term = new Terminal({
        convertEol: true,
        allowProposedApi: true,
        cols: cols,
        rows: rows,
        fontFamily: 'Fira Code',
        fontSize: fontSize,
        cursorBlink: true,
        customGlyphs: true,
        cursorStyle: 'block',
    });
    term.onResize(e => onTermResize(e));
    term.loadAddon(webglAddon);
    term.loadAddon(weblinksAddon);
    term.loadAddon(fitAddon);
    term.open(el_terminal);
    fitAddon.fit();
    // el_terminal.style.width = term._core._viewportScrollArea.clientWidth.toString() + "px";
    return true;
}

async function onLoad(e) {
    let params = new URLSearchParams(document.location.search);
    let id = params.get("id");
    let key = params.get("key");
    if (!id) {
        document.getElementById('title').innerHTML = 'Invalid link';
        return;
    }
    const dl = await download(id);
    if (!dl) {
        document.getElementById('title').innerHTML = 'Invalid link';
        return;
    }
    document.getElementById('views').innerHTML = '<br>views: ' + dl.views;
    const img = document.createElement('img');
    img.src = dl.pic;
    img.id = 'img';
    img.onload = () => {
        const t = document.getElementById('title')
        t.style.width = img.naturalWidth + "px";
        t.innerHTML = dl.title;
        const d = document.getElementById('desc')
        d.style.width = img.naturalWidth + "px";
        d.innerHTML = '<br>' + dl.desc;
        document.getElementById('size').innerHTML = 'size: ' + dl.size
        img.style.width = img.naturalWidth + "px";
        const p = document.getElementById('pic');
        p.style.width = img.naturalWidth + 20 + "px";
        if (img.naturalWidth > window.innerWidth) {
            t.style.width = '100%';
            d.style.width = '100%';
            p.style.width = '100%';
            img.style.width = '100%';
            document.getElementById('result').style.width = '100%';
        }
        p.appendChild(img);
        let play = document.createElement('button');
        play.id = 'play_button';
        play.onclick = onPlay;
        play.innerHTML = 'Play';
        document.getElementById('play').appendChild(play);
    }
    // base64 encoded and compressed asciicast -> bytes -> decompress bytes -> decode to text
    const cast_b64 = await fetch('data:application/octet-stream;base64,' + dl.cast);
    const cast = await cast_b64.arrayBuffer();
    const uz = await pako.inflate(cast);
    const dec = new TextDecoder("utf-8");
    const downloaded_cast = dec.decode(uz).trim();
    const el_download = document.createElement('button');
    el_download.addEventListener('click', e => onDownload(e));
    el_download.innerHTML = 'Download';
    document.getElementById('download').appendChild(el_download);
    async function onDownload(e) {
        saveBlob(dl.title + '.cast', downloaded_cast);
    }
    parse_cast(downloaded_cast);

    if (key) {
        // client is claiming to have the key, so display delete button
        let delete_button = document.createElement('button');
        delete_button.className = 'delete';
        delete_button.innerHTML = 'Delete';
        delete_button.onclick = onDelete;
        async function onDelete() {
            if (!confirm("Really delete?")) {
                return;
            }
            delete_button.disabled = true;
            delete_button.className = 'disabled';
            const r = await fetch('/delete?id=' + id + '&key=' + key);
            if (r.status !== 200) {
                alert('Delete failed!');
            }
        }
        const e = document.getElementById('delete_div');
        e.appendChild(delete_button);
        document.getElementById('warning').innerHTML = 'BOOKMARK THIS URL IF YOU MAY WANT TO DELETE THIS LATER<br>DO NOT SHARE THIS URL, ANYONE WITH THE KEY CAN DELETE THIS RECORDING';
        let share = document.createElement('input');
        share.type = 'text';
        share.id = 'share';
        share.value = window.location.origin + '/play?id=' + id;
        const width = getTextWidth(share.value.length, '18px Fira Code');
        share.style.width = width + "px";
        share.readOnly = true;
        let copy_button = document.createElement('button');
        copy_button.innerHTML = 'Copy';
        copy_button.onclick = onCopy;
        async function onCopy() {
            share.select();
            share.setSelectionRange(0, 777);
            await navigator.clipboard.writeText(share.value);
        }
        const s = document.getElementById('share_div');
        let p = document.createElement('p');
        p.innerHTML = 'Share this recording:';
        document.getElementById('share_text').appendChild(p);
        s.appendChild(share);
        s.appendChild(copy_button);
    }
}
async function onWindowResize(e) {
    const img = document.getElementById('img');
    if (img) {
        if (img.naturalWidth > window.innerWidth) {
            document.getElementById('title').style.width = '100%';
            document.getElementById('desc').style.width = '100%';
            document.getElementById('pic').style.width = '100%';
            img.style.width = '100%';
            document.getElementById('result').style.width = '100%';
        }
    }
    if (term) {
        let fontSize = 16;
        let width = await getTextWidth(cast_header.width, '16px Fira Code');
        console.log('width for 16px = ' + width);
        console.log('window width = ' + window.innerWidth);
        if (width > window.innerWidth) {
            const res = await getMaxTextSize();
            fontSize = res[0];
            // width = res[1];
            term.options.fontSize = fontSize;
            document.getElementById('terminal').style.width = '100%';
            const r = document.getElementById('result');
            r.style.width = '100%';
            r.className = null;
        } else {
            document.getElementById('terminal').style.width = width.toString() + 'px';
            const r = document.getElementById('result');
            r.style.width = (width + 20).toString() + 'px';
            r.className = 'container';
        }
        fitAddon.fit();
    }
}
document.addEventListener('DOMContentLoaded', e => onLoad(e));
window.addEventListener('resize', e => onWindowResize(e));