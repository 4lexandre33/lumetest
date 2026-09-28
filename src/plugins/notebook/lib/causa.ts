export type Causa = { de: string; para: string; porque: string };

const LINHA = /^causa:\s*(\S+)\s*->\s*(\S+)\s+porque\s+(\S(?:.*\S)?)\s*$/i;

/** Só a linha que o autor declarou. Uma frase com «porque» não chega. */
export function causasDeclaradas(texto: string): Causa[] {
  const out: Causa[] = [];
  for (const line of texto.split("\n")) {
    const hit = LINHA.exec(line.trim());
    if (!hit?.[1] || !hit[2] || !hit[3]) continue;
    out.push({ de: hit[1], para: hit[2], porque: hit[3] });
  }
  return out;
}
