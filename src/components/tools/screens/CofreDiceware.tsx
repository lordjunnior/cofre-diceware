import { useEffect, useMemo, useState } from 'react';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { Dices, Gauge, Cpu } from 'lucide-react';
import { SuiteHero, CopyBox, Stat, Faq, Tilt } from './SovereignKit';
import { entropyBits, passwordEntropy, crackSeconds, strengthLabel, humanDuration, uniformIndex, charsetSize } from '@/components/tools/lib/sovereign-math';

const ATTACKERS = [
  { id: 'online', label: 'Site com limite', rate: 100, note: '100 tentativas/s' },
  { id: 'gpu', label: '1 placa RTX 4090', rate: 1e11, note: '100 bilhões/s (hash rápido)' },
  { id: 'farm', label: 'Fazenda de 10 mil GPUs', rate: 1e15, note: '1 quatrilhão/s' },
  { id: 'state', label: 'Estado-nação', rate: 1e18, note: '1 quintilhão/s' },
] as const;
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.<>/?~|';

export default function CofreDiceware() {
  const [mode, setMode] = useState<'frase' | 'senha'>('frase');
  const [count, setCount] = useState(6);
  const [length, setLength] = useState(20);
  const [sep, setSep] = useState('-');
  const [opts, setOpts] = useState({ lower: true, upper: true, digits: true, symbols: true });
  const [attacker, setAttacker] = useState<(typeof ATTACKERS)[number]['id']>('farm');
  const [words, setWords] = useState<string[]>([]);
  const [secret, setSecret] = useState('');
  const [flip, setFlip] = useState(0);
  const [own, setOwn] = useState('');

  const pool = useMemo(() => {
    let s = '';
    if (opts.lower) s += 'abcdefghijklmnopqrstuvwxyz';
    if (opts.upper) s += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (opts.digits) s += '0123456789';
    if (opts.symbols) s += SYMBOLS;
    return s;
  }, [opts]);

  const roll = () => {
    if (mode === 'frase') setWords(Array.from({ length: count }, () => wordlist[uniformIndex(wordlist.length)]!));
    else if (pool) setSecret(Array.from({ length }, () => pool[uniformIndex(pool.length)]!).join(''));
    setFlip(f => f + 1);
  };
  useEffect(roll, [mode, count, length, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  const bits = mode === 'frase' ? entropyBits(wordlist.length, count) : entropyBits(pool.length, length);
  const rate = ATTACKERS.find(a => a.id === attacker)!.rate;
  const output = mode === 'frase' ? words.join(sep) : secret;
  const ownBits = passwordEntropy(own);
  const pct = (b: number) => `${Math.min(100, (b / 128) * 100)}%`;

  return <div className="ss-root">
    <SuiteHero kicker="Senhas que nenhuma máquina quebra" title="Cofre" accent="Diceware" repo="https://github.com/keepassxreboot/keepassxc" repoLabel="KEEPASSXC"
      lead="A força de uma senha não está em parecer complicada. Está na quantidade de possibilidades. Gere frases fáceis de lembrar e impossíveis de adivinhar, e veja em números quanto tempo um atacante levaria." />
    <div className="ss-wrap">
      <div className="ss-grid">
        <section className="ss-plate">
          <span className="ss-tag">01 · GERADOR</span>
          <h2><Dices size={22} style={{ display: 'inline', marginRight: 10 }} />Monte o segredo</h2>
          <div className="ss-chips" role="group" aria-label="Tipo">
            <button type="button" className="ss-chip" aria-pressed={mode === 'frase'} onClick={() => setMode('frase')}>Frase de palavras</button>
            <button type="button" className="ss-chip" aria-pressed={mode === 'senha'} onClick={() => setMode('senha')}>Senha aleatória</button>
          </div>
          {mode === 'frase' ? <>
            <label className="ss-label" htmlFor="dw-n">Palavras: {count} (cada uma vale 11 bits)</label>
            <input id="dw-n" className="ss-range" type="range" min={3} max={12} value={count} onChange={e => setCount(Number(e.target.value))} />
            <span className="ss-label">Separador</span>
            <div className="ss-chips">{['-', ' ', '.', '_'].map(s => <button key={s} type="button" className="ss-chip" aria-pressed={sep === s} onClick={() => setSep(s)}>{s === ' ' ? 'espaço' : s}</button>)}</div>
          </> : <>
            <label className="ss-label" htmlFor="dw-l">Caracteres: {length}</label>
            <input id="dw-l" className="ss-range" type="range" min={8} max={64} value={length} onChange={e => setLength(Number(e.target.value))} />
            <span className="ss-label">Conjunto ({charsetSize(opts)} símbolos possíveis)</span>
            <div className="ss-chips">{([['lower', 'a-z'], ['upper', 'A-Z'], ['digits', '0-9'], ['symbols', '!@#']] as const).map(([k, l]) =>
              <button key={k} type="button" className="ss-chip" aria-pressed={opts[k]} onClick={() => setOpts(o => { const n = { ...o, [k]: !o[k] }; return Object.values(n).some(Boolean) ? n : o; })}>{l}</button>)}</div>
          </>}
          <div className="ss-row"><button type="button" className="ss-btn" onClick={roll}><Dices size={14} />Rolar de novo</button></div>
        </section>

        <section className="ss-plate">
          <span className="ss-tag">02 · RESULTADO</span>
          <h2>Seu segredo</h2>
          <p className="ss-sub">Sorteio uniforme com o gerador criptográfico do aparelho, sem viés. {mode === 'frase' ? 'Lista oficial BIP-39 de 2048 palavras.' : ''}</p>
          {mode === 'frase' && <div className="ss-words" style={{ marginBottom: 14 }}>{words.map((w, i) =>
            <div key={i} className={`ss-word${flip % 2 ? ' flip' : ''}`} style={{ transitionDelay: `${i * 60}ms` }}>
              <div><small>{String(i + 1).padStart(2, '0')}</small><strong>{flip % 2 ? '' : w}</strong></div>
              <div><small>{String(i + 1).padStart(2, '0')}</small><strong>{flip % 2 ? w : ''}</strong></div>
            </div>)}</div>}
          <CopyBox value={output} />
          <div className="ss-stats" style={{ marginTop: 16 }}>
            <Stat value={Math.floor(bits)} label="Bits de entropia" tone="hot" />
            <Stat value={strengthLabel(bits)} label="Classificação" tone={bits >= 64 ? 'hot' : 'ember'} />
          </div>
        </section>
      </div>

      <section className="ss-plate">
        <span className="ss-tag">03 · ATAQUE</span>
        <h2><Cpu size={22} style={{ display: 'inline', marginRight: 10 }} />Quem tenta quebrar?</h2>
        <p className="ss-sub">Tempo médio para acertar testando metade de todas as possibilidades, na velocidade de cada atacante.</p>
        <div className="ss-chips">{ATTACKERS.map(a => <button key={a.id} type="button" className="ss-chip" aria-pressed={attacker === a.id} onClick={() => setAttacker(a.id)}>{a.label} · {a.note}</button>)}</div>
        <Tilt max={4}><div className="ss-stats" style={{ marginTop: 18 }}>
          <Stat value={humanDuration(crackSeconds(bits, rate))} label="Tempo para quebrar o gerado" tone="hot" />
          <Stat value={own ? humanDuration(crackSeconds(ownBits, rate)) : '-'} label="Tempo para quebrar a sua" tone="ember" />
        </div></Tilt>
      </section>

      <section className="ss-plate">
        <span className="ss-tag">04 · AUDITORIA</span>
        <h2><Gauge size={22} style={{ display: 'inline', marginRight: 10 }} />Teste a sua senha</h2>
        <p className="ss-sub">Digite e veja o teto teórico. O cálculo roda só nesta aba, nada é gravado ou enviado. Senhas com nomes, datas ou palavras previsíveis valem muito menos que este teto.</p>
        <input className="ss-input" type="password" autoComplete="off" placeholder="digite para medir" value={own} onChange={e => setOwn(e.target.value)} aria-label="Sua senha" />
        <div style={{ display: 'grid', gap: 10, marginTop: 16 }}>
          <span className="ss-label" style={{ margin: 0 }}>Sua senha · {Math.floor(ownBits)} bits · {own ? strengthLabel(ownBits) : '-'}</span>
          <div className="ss-bar"><i style={{ width: pct(ownBits) }} /></div>
          <span className="ss-label" style={{ margin: 0 }}>Gerada aqui · {Math.floor(bits)} bits</span>
          <div className="ss-bar"><i style={{ width: pct(bits) }} /></div>
        </div>
      </section>

      <div className="ss-warn">Uma senha forte por serviço, nunca repetida. Guarde todas em um cofre local como o KeePassXC e proteja o cofre com uma frase de 6 palavras ou mais. A única senha que você precisa decorar é a do cofre.</div>

      <Faq items={[
        { q: 'Por que palavras em vez de símbolos?', a: 'Seis palavras sorteadas de 2048 dão 66 bits, mais que uma senha de 10 caracteres misturados, e você consegue decorar.' },
        { q: 'Quantos bits são suficientes?', a: 'Contra um site que limita tentativas, 40 bits já bastam. Contra quem roubou um arquivo de senhas e testa offline, mire em 80 bits ou mais (8 palavras). Cofres como o KeePassXC usam Argon2, que torna cada tentativa milhões de vezes mais lenta e multiplica essa margem.' },
        { q: 'Usar o sorteio deste site é seguro?', a: 'O sorteio usa o gerador criptográfico do próprio navegador e nada sai da página. Para segredos críticos, gere offline no KeePassXC ou com dados físicos.' },
        { q: 'Posso trocar uma palavra que não gostei?', a: 'Não. Escolher a dedo reduz as possibilidades. Role de novo a frase inteira.' },
      ]} />
    </div>
  </div>;
}
