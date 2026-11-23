/** Tira o "E · " do começo do aviso quando o selo da tecla já mostra a mesma tecla. */
export const promptWithoutKey=(prompt:string|undefined,key:string|undefined)=>prompt&&key&&prompt.startsWith(`${key} · `)?prompt.slice(key.length+3):prompt;
