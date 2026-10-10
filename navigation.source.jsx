import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {createPortal,flushSync} from 'react-dom';

const paths = {
 home:'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9',
 rankings:'M4 21V11h3v10M11 21V3h3v18M18 21V7h3v14',
 fighters:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 10a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-3a4 4 0 0 0-3-4M16 3a4 4 0 0 1 0 7',
 champions:'M8 3h8v7a4 4 0 0 1-8 0ZM8 5H3v3a5 5 0 0 0 5 5M16 5h5v3a5 5 0 0 1-5 5M12 14v7M8 21h8',
 events:'M5 5h14v16H5ZM8 2v6M16 2v6M5 10h14M9 14h6M9 17h4',
 video:'M3 5h18v14H3ZM10 9l5 3-5 3Z',
 about:'M12 17v-5M12 8h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 search:'M21 21l-6-6M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
 menu:'M4 6h16M4 12h16M4 18h16',
 more:'M4 12h.01M12 12h.01M20 12h.01'
};
const links=[['home','Главная'],['rankings','Рейтинг бойцов'],['fighters','Бойцы'],['champions','Чемпионы'],['events','Турниры'],['about','О лиге']];
function Icon({name}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name==='more'?<><circle cx="4" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="20" cy="12" r="1"/></>:<path d={paths[name]||paths.about}/>}</svg>;}
function copy(label,fallback){const field=window.ALASH_COPY_FIELDS.find(f=>f.label===label);return window.ALASH_DATA.copy?.[field?.key]||fallback;}
function Logo({header=false}){const content=<><img src={window.ALASH_DATA.media?.logo||'logo.jpg'} width="52" height="52" alt={header?'Логотип Alash Pride':''}/><span>ALASH<br/>PRIDE{header&&<small>{copy('Подпись логотипа','LEAGUE')}</small>}</span></>;return header?<a className="identity" href="#home" aria-label="Alash Pride — главная">{content}</a>:<span id="menu-title" className="identity">{content}</span>;}
function Navigation(){
 const getRoute=()=>{const r=(location.hash.slice(1)||'home').split(/[/?]/)[0];return r==='fighter'?'fighters':r;};
 const [route,setRoute]=useState(getRoute),[,refresh]=useState(0),[opened,setOpened]=useState(false);
 const dialog=useRef(null),opener=useRef(null),restoreFocus=useRef(true);
 useEffect(()=>{const hash=()=>{setRoute(getRoute());if(dialog.current?.open){restoreFocus.current=false;dialog.current.close();}};const data=()=>refresh(n=>n+1);window.addEventListener('hashchange',hash);window.addEventListener('alash:rankings',data);return()=>{window.removeEventListener('hashchange',hash);window.removeEventListener('alash:rankings',data);document.body.classList.remove('menu-open');};},[]);
 function open(event){opener.current=event.currentTarget;restoreFocus.current=true;dialog.current.showModal();setOpened(true);document.body.classList.add('menu-open');}
 function closed(){setOpened(false);document.body.classList.remove('menu-open');if(restoreFocus.current)opener.current?.focus({preventScroll:true});}
 const menuLabel=(id,fallback)=>copy('Меню: '+({rankings:'Рейтинг',home:'Главная',fighters:'Бойцы',champions:'Чемпионы',events:'Турниры',about:'О лиге'}[id]),fallback);
 return <>
 {createPortal(<div className="shell header-row"><Logo header/><nav className="desktop-nav" aria-label="Основная навигация">{links.filter(([id])=>['rankings','fighters','champions','events'].includes(id)).map(([id,label])=><a key={id} href={'#'+id} aria-current={route===id?'page':undefined}>{menuLabel(id,id==='rankings'?'Рейтинг':label)}</a>)}</nav><div className="header-actions"><a href="#fighters?search=1" className="icon-button search-shortcut" aria-label="Поиск бойца"><Icon name="search"/></a><button className="icon-button menu-button" aria-label="Открыть меню" aria-haspopup="dialog" aria-expanded={opened} aria-controls="site-menu" onClick={open}><Icon name="menu"/></button></div></div>,document.querySelector('#react-header'))}
 <nav className="bottom-nav" aria-label="Мобильная навигация">{[['home','Главная'],['rankings','Рейтинг'],['fighters','Бойцы'],['events','Турниры']].map(([id,label])=><a key={id} href={'#'+id} aria-current={route===id?'page':undefined}><Icon name={id}/><span>{menuLabel(id,label)}</span></a>)}<button className="more-menu" aria-label="Все разделы" aria-haspopup="dialog" aria-expanded={opened} aria-controls="site-menu" onClick={open}><Icon name="more"/><span>{copy('Нижнее меню: Ещё','Ещё')}</span></button></nav>
 <dialog ref={dialog} id="site-menu" aria-labelledby="menu-title" onClose={closed} onClick={event=>{if(event.target===dialog.current)dialog.current.close();}}>
 <div className="menu-top"><Logo/><button className="icon-button close-menu" aria-label="Закрыть меню" onClick={()=>dialog.current.close()}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>
 <nav className="menu-links" aria-label="Все разделы">{links.map(([id,label])=><a key={id} href={'#'+id} aria-current={route===id?'page':undefined} onClick={()=>{restoreFocus.current=false;dialog.current.close();if(route===id)document.querySelector('#main')?.focus();}}><Icon name={id}/><span>{menuLabel(id,label)}</span><span>›</span></a>)}</nav>
 <div className="menu-socials"><a href="https://www.instagram.com/alash_pridefc/" target="_blank" rel="noopener noreferrer">Instagram ↗</a><a href="https://www.youtube.com/@alashpridetv" target="_blank" rel="noopener noreferrer">YouTube ↗</a></div>
 <a className="primary-button" href="#tickets" onClick={()=>{restoreFocus.current=false;dialog.current.close();}}>{copy('Кнопка билетов в меню','БИЛЕТЫ НА ТУРНИР ')}<span aria-hidden="true">→</span></a>
 </dialog></>;
}
flushSync(()=>createRoot(document.querySelector('#navigation-root')).render(<Navigation/>));
