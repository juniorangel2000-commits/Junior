/** Ícones de traço do filtro das telas de fabricar (preview.49), no estilo dos ícones da barra de
 * cima (diário da mina, diário de pesca): SVG 24×24, linha de 1,5 na cor do texto, sem arte de item. */
const P:Record<string,string>={
 all:'<rect x="3.5" y="3.5" width="7" height="7" rx="1"/><rect x="13.5" y="3.5" width="7" height="7" rx="1"/><rect x="3.5" y="13.5" width="7" height="7" rx="1"/><rect x="13.5" y="13.5" width="7" height="7" rx="1"/>',
 learn:'<path d="M4 5.5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0Z"/><path d="M12 5.5c2.5-1.5 5-1.5 8 0v14c-3-1.5-5.5-1.5-8 0"/><path d="M15 9h2.5M15 12h2.5"/>',
 materials:'<path d="M3 15.5 12 11l9 4.5-9 4.5Z"/><path d="M3 11.5 12 7l9 4.5"/><path d="M3 7.5 12 3l9 4.5"/>',
 tools:'<path d="M14 4.5c2-1.5 5-1 6.5 1.5L17 9.5"/><path d="m15.5 8 1.5 1.5"/><path d="M15.5 8 4.5 19a1.4 1.4 0 0 0 2 2L17.5 10"/>',
 upgrades:'<path d="M12 20V5"/><path d="m6 11 6-6 6 6"/><path d="M5 20h14"/>',
 healing:'<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M12 8v8M8 12h8"/>',
 field:'<path d="M12 3c3 4 5 6 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5.5 2 1.5 3 3 3-1-3 0-6 0-8.5Z"/><path d="M5 21h14"/>',
 animals:'<path d="M5 21v-6a7 7 0 0 1 14 0v6Z"/><path d="M8 9.5 6 4l4 3M16 9.5 18 4l-4 3"/><circle cx="10" cy="14" r=".6"/><circle cx="14" cy="14" r=".6"/>',
 equipment:'<path d="M7 7V5.5A2.5 2.5 0 0 1 9.5 3h5A2.5 2.5 0 0 1 17 5.5V7"/><rect x="4.5" y="7" width="15" height="14" rx="3"/><path d="M8.5 13h7v4h-7Z"/>',
 combat:'<path d="M19.5 3.5 9 14l1 1L20.5 4.5V3.5Z"/><path d="m7 12 5 5M5 18.5l3-3M4 20l1.5-1.5"/>',
 house:'<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
 furniture:'<path d="M7 3.5v17M7 12h10v8.5M7 12V8h9"/><path d="M17 12V3.5"/>',
 installations:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.3 1 2.1v.5h5V16c0-.8.4-1.6 1-2.1A6 6 0 0 0 12 3Z"/>',
 machines:'<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>',
 projects:'<path d="M5 3.5h10l4 4v13H5Z"/><path d="M15 3.5v4h4M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/>',
};
export const categoryIcon=(id:string)=>`<svg class="icon category-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${P[id]??P.all}</svg>`;
