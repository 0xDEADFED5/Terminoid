// Copyright 2024 0xDEADFED5
async function shuffle(array) {
    for (let x = array.length - 1; x > 0; x--) {
        let y = Math.floor(Math.random() * (x + 1));
        let s = array[x];
        array[x] = array[y];
        array[y] = s;
    }
}

async function onLoad(e) {
    const r = await fetch('/random');
    const o = await r.json();
    shuffle(o);
    o.forEach(add);
    function add(value) {
        let a = document.createElement('a');
        a.className = 'result_link';
        a.style.borderRadius = '12px';
        a.href = '/play' + '?id=' + value.id;
        a.target = '_blank';
        let div = document.createElement('div');
        div.className = 'result';
        div.style.border = '1px solid #3f3f44';
        div.style.borderRadius = '12px';
        div.style.padding = '10px';
        let t = document.createElement('p');
        t.innerHTML = value.title;
        const img = document.createElement('img');
        img.src = value.pic;
        let d = document.createElement('p');
        d.innerHTML = value.desc;
        let v = document.createElement('p');
        v.innerHTML = 'views: ' + value.views;
        let s = document.createElement('p');
        s.innerHTML = 'size: ' + value.size;
        img.onload = () => {
            img.style.width = img.naturalWidth + "px";
            d.style.width = img.naturalWidth + "px";
            div.style.width = img.naturalWidth + 20 + "px";
            div.appendChild(t);
            div.appendChild(img);
            div.appendChild(d);
            div.appendChild(v);
            div.appendChild(s);
        }
        a.appendChild(div);
        let r = document.getElementById('results');
        r.appendChild(a);
    }
}
document.addEventListener("DOMContentLoaded", e => onLoad(e));