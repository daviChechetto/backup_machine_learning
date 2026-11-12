import { useState, useMemo, useEffect } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { 
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ZAxis, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { Download, UserPlus, TrendingUp, AlertCircle, CheckCircle2, LayoutDashboard, Sun, Moon, Network } from 'lucide-react';

// --- Funções Utilitárias ---
const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
};

const gerarDadosSimulados = (quantidade: number) => {
    const dadosClientes = [];
    for (let indice = 0; indice < quantidade; indice++) {
        const renda = Math.random() * 7000 + 1500;
        const divida = Math.random() * 3000;
        const atrasos = Math.random() > 0.7 ? Math.random() * 45 : 0; 
        
        let pontuacaoBruta = (renda / (divida + 200)) * 150 - (atrasos * 12);
        let pontuacao = Math.max(50, Math.min(950, pontuacaoBruta + 400 + (Math.random() * 100 - 50))); 
        pontuacao = Math.round(pontuacao);

        const grupoComportamental = Math.floor(Math.random() * 3); 
        const limiteRecomendado = Math.max(0, renda * 0.20 * (pontuacao / 500));
        const historicoPagamentos = pontuacao > 550 ? 1 : 0;

        dadosClientes.push({
            id: `CLIENTE-${Math.floor(Math.random() * 100000)}`,
            monthly_incomes: renda,
            active_debts: divida,
            days_in_arrears: Math.round(atrasos),
            payment_histories: historicoPagamentos,
            behavioral_clusters: grupoComportamental,
            credit_scores: pontuacao,
            recommended_credit_limits: limiteRecomendado
        });
    }
    return dadosClientes;
};

// --- Implementação do Algoritmo K-Means ---
const normalizar_dados = (valores: number[]) => {
    const valor_minimo = Math.min(...valores);
    const valor_maximo = Math.max(...valores);
    return valores.map(valor => valor_maximo === valor_minimo ? 0 : (valor - valor_minimo) / (valor_maximo - valor_minimo));
};

const aplicar_k_means = (clientes: any[], quantidade_clusters: number = 3, maximo_iteracoes: number = 50) => {
    if (clientes.length === 0) return clientes;

    const rendas = clientes.map(cliente => cliente.monthly_incomes);
    const dividas = clientes.map(cliente => cliente.active_debts);
    const atrasos = clientes.map(cliente => cliente.days_in_arrears);
    const pontuacoes = clientes.map(cliente => cliente.credit_scores);

    const rendas_normalizadas = normalizar_dados(rendas);
    const dividas_normalizadas = normalizar_dados(dividas);
    const atrasos_normalizados = normalizar_dados(atrasos);
    const pontuacoes_normalizadas = normalizar_dados(pontuacoes);

    const dados_completos = clientes.map((cliente, indice) => ({
        original: cliente,
        caracteristicas: [
            rendas_normalizadas[indice], 
            dividas_normalizadas[indice], 
            atrasos_normalizados[indice], 
            pontuacoes_normalizadas[indice]
        ],
        cluster_atribuido: 0
    }));

    let centroides: number[][] = [];
    const indices_escolhidos = new Set<number>();
    while(centroides.length < quantidade_clusters) {
        const indice_aleatorio = Math.floor(Math.random() * dados_completos.length);
        if(!indices_escolhidos.has(indice_aleatorio)) {
            indices_escolhidos.add(indice_aleatorio);
            centroides.push([...dados_completos[indice_aleatorio].caracteristicas]);
        }
    }

    const calcular_distancia_euclidiana = (ponto_a: number[], ponto_b: number[]) => {
        return Math.sqrt(ponto_a.reduce((soma, valor, indice) => soma + Math.pow(valor - ponto_b[indice], 2), 0));
    };

    let iteracao_atual = 0;
    let houve_mudanca = true;

    while(houve_mudanca && iteracao_atual < maximo_iteracoes) {
        houve_mudanca = false;
        iteracao_atual++;

        dados_completos.forEach(ponto => {
            let distancia_minima = Infinity;
            let melhor_cluster = ponto.cluster_atribuido;
            
            centroides.forEach((centroide, indice_centroide) => {
                const distancia_calculada = calcular_distancia_euclidiana(ponto.caracteristicas, centroide);
                if(distancia_calculada < distancia_minima) {
                    distancia_minima = distancia_calculada;
                    melhor_cluster = indice_centroide;
                }
            });
            
            if(ponto.cluster_atribuido !== melhor_cluster) {
                ponto.cluster_atribuido = melhor_cluster;
                houve_mudanca = true;
            }
        });

        const novos_centroides = Array.from({length: quantidade_clusters}, () => new Array(4).fill(0));
        const contagem_por_cluster = new Array(quantidade_clusters).fill(0);

        dados_completos.forEach(ponto => {
            const cluster = ponto.cluster_atribuido;
            contagem_por_cluster[cluster]++;
            ponto.caracteristicas.forEach((valor, indice) => {
                novos_centroides[cluster][indice] += valor;
            });
        });

        centroides = novos_centroides.map((centroide, indice) => {
            if(contagem_por_cluster[indice] === 0) return centroides[indice]; 
            return centroide.map(valor => valor / contagem_por_cluster[indice]);
        });
    }

    // Ordenar os clusters (0 = Risco, 1 = Geral, 2 = Premium) com base na média de score
    const analise_clusters = centroides.map((centroide, indice) => {
        const clientes_do_cluster = dados_completos.filter(dado => dado.cluster_atribuido === indice);
        const media_pontuacao = clientes_do_cluster.reduce((soma, dado) => soma + dado.original.credit_scores, 0) / (clientes_do_cluster.length || 1);
        return { indice_original: indice, media_pontuacao };
    });

    analise_clusters.sort((a, b) => a.media_pontuacao - b.media_pontuacao);
    
    const mapa_de_conversao = new Map();
    analise_clusters.forEach((analise, novo_indice) => {
        mapa_de_conversao.set(analise.indice_original, novo_indice);
    });

    return dados_completos.map(ponto => ({
        ...ponto.original,
        behavioral_clusters: mapa_de_conversao.get(ponto.cluster_atribuido)
    }));
};

export default function AplicativoPrincipal() {
    const [dadosGeraisClientes, definirDadosGeraisClientes] = useState<any[]>([]);
    const [dadosFormulario, definirDadosFormulario] = useState({
        renda: 3000,
        divida: 500,
        atrasos: 0
    });
    
    const [modoEscuro, setModoEscuro] = useState(() => {
        if (typeof window !== 'undefined') {
            const temaGuardado = localStorage.getItem('tema');
            if (temaGuardado) return temaGuardado === 'escuro';
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });

    useEffect(() => {
        definirDadosGeraisClientes(gerarDadosSimulados(150));
    }, []);

    useEffect(() => {
        if (modoEscuro) {
            document.documentElement.classList.add('tema-escuro');
            localStorage.setItem('tema', 'escuro');
        } else {
            document.documentElement.classList.remove('tema-escuro');
            localStorage.setItem('tema', 'claro');
        }
    }, [modoEscuro]);

    const alternarTema = () => {
        setModoEscuro(!modoEscuro);
    };

    const manipularAlteracaoCampo = (evento: ChangeEvent<HTMLInputElement>) => {
        const { name, value } = evento.target;
        definirDadosFormulario(estadoAnterior => ({
            ...estadoAnterior,
            [name]: Number(value)
        }));
    };

    const adicionarCliente = (evento: FormEvent<HTMLFormElement>) => {
        evento.preventDefault();
        const { renda, divida, atrasos } = dadosFormulario;
        
        let pontuacaoBruta = (renda / (divida + 200)) * 150 - (atrasos * 12);
        let pontuacao = Math.max(50, Math.min(950, pontuacaoBruta + 400));
        pontuacao = Math.round(pontuacao);
        
        const grupoComportamental = renda > 5000 ? 2 : (atrasos > 15 ? 0 : 1);
        const limiteRecomendado = Math.max(0, renda * 0.20 * (pontuacao / 500));
        
        const novoCliente = {
            id: `CLIENTE-${Math.floor(Math.random() * 100000)}`,
            monthly_incomes: renda,
            active_debts: divida,
            days_in_arrears: atrasos,
            payment_histories: pontuacao > 550 ? 1 : 0,
            behavioral_clusters: grupoComportamental,
            credit_scores: pontuacao,
            recommended_credit_limits: limiteRecomendado
        };

        definirDadosGeraisClientes(estadoAnterior => [...estadoAnterior, novoCliente]);
    };

    const reclassificar_clientes_k_means = () => {
        const clientes_atualizados = aplicar_k_means(dadosGeraisClientes, 3);
        definirDadosGeraisClientes(clientes_atualizados);
    };

    const descarregarFicheiroCSV = () => {
        const cabecalhos = [
            'id', 'monthly_incomes', 'active_debts', 'days_in_arrears', 
            'payment_histories', 'behavioral_clusters', 'credit_scores', 'recommended_credit_limits'
        ];
        
        const linhasCSV: string[] = [];
        linhasCSV.push(cabecalhos.join(','));
        
        dadosGeraisClientes.forEach(linha => {
            const valores = cabecalhos.map(cabecalho => {
                const valor = linha[cabecalho];
                return typeof valor === 'number' ? valor.toFixed(2) : String(valor);
            });
            linhasCSV.push(valores.join(','));
        });
        
        const objetoBinario = new Blob([linhasCSV.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(objetoBinario);
        const elementoAncora = document.createElement('a');
        elementoAncora.setAttribute('hidden', '');
        elementoAncora.setAttribute('href', url);
        elementoAncora.setAttribute('download', 'analise_credito_clientes.csv');
        document.body.appendChild(elementoAncora);
        elementoAncora.click();
        document.body.removeChild(elementoAncora);
    };

    const dadosPorGrupo = useMemo(() => {
        return {
            grupoZero: dadosGeraisClientes.filter(dado => dado.behavioral_clusters === 0),
            grupoUm: dadosGeraisClientes.filter(dado => dado.behavioral_clusters === 1),
            grupoDois: dadosGeraisClientes.filter(dado => dado.behavioral_clusters === 2),
        };
    }, [dadosGeraisClientes]);

    const dadosHistograma = useMemo(() => {
        const caixas = [0, 0, 0, 0, 0];
        dadosGeraisClientes.forEach(dado => {
            if (dado.credit_scores <= 200) caixas[0]++;
            else if (dado.credit_scores <= 400) caixas[1]++;
            else if (dado.credit_scores <= 600) caixas[2]++;
            else if (dado.credit_scores <= 800) caixas[3]++;
            else caixas[4]++;
        });
        return [
            { intervalo: '0-200', quantidade: caixas[0] },
            { intervalo: '201-400', quantidade: caixas[1] },
            { intervalo: '401-600', quantidade: caixas[2] },
            { intervalo: '601-800', quantidade: caixas[3] },
            { intervalo: '801-1000', quantidade: caixas[4] },
        ];
    }, [dadosGeraisClientes]);

    const registosRecentes = useMemo(() => dadosGeraisClientes.slice(-5).reverse(), [dadosGeraisClientes]);

    const DicaDeFerramentaPersonalizadaGraficoDispersao = ({ active: ativo, payload: cargaUtil }: any) => {
        if (ativo && cargaUtil && cargaUtil.length) {
            const dados = cargaUtil[0].payload;
            return (
                <div className="dica-ferramenta-grafico">
                    <p className="titulo-dica">Cliente: {dados.id}</p>
                    <p className="linha-dica">Renda: <span>{formatarMoeda(dados.monthly_incomes)}</span></p>
                    <p className="linha-dica">Score: <span>{dados.credit_scores}</span></p>
                    <p className="linha-dica">Limite: <span className="texto-verde">{formatarMoeda(dados.recommended_credit_limits)}</span></p>
                    <p className="linha-dica">Cluster: <span>{dados.behavioral_clusters}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="painel-principal">
            <aside className="barra-lateral">
                <div className="cabecalho-barra-lateral">
                    <div className="icone-cabecalho">
                        <LayoutDashboard size={24} />
                    </div>
                    <h1>Motor de Score</h1>
                </div>

                <div className="conteudo-barra-lateral">
                    <div className="cabecalho-formulario">
                        <h2>Adicionar Cliente</h2>
                        <UserPlus size={18} />
                    </div>

                    <form onSubmit={adicionarCliente} className="formulario-cliente">
                        <div className="grupo-entrada">
                            <label className="rotulo-entrada">Renda Mensal (R$)</label>
                            <input 
                                type="number" 
                                name="renda"
                                required
                                min="0"
                                step="100"
                                value={dadosFormulario.renda}
                                onChange={manipularAlteracaoCampo}
                                className="campo-entrada"
                            />
                        </div>

                        <div className="grupo-entrada">
                            <label className="rotulo-entrada">Dívida Ativa (R$)</label>
                            <input 
                                type="number" 
                                name="divida"
                                required
                                min="0"
                                step="100"
                                value={dadosFormulario.divida}
                                onChange={manipularAlteracaoCampo}
                                className="campo-entrada"
                            />
                        </div>

                        <div className="grupo-entrada">
                            <label className="rotulo-entrada">Dias em Atraso</label>
                            <input 
                                type="number" 
                                name="atrasos"
                                required
                                min="0"
                                step="1"
                                value={dadosFormulario.atrasos}
                                onChange={manipularAlteracaoCampo}
                                className="campo-entrada"
                            />
                        </div>

                        <button type="submit" className="botao-processar">
                            <TrendingUp size={18} />
                            Processar Dados
                        </button>
                        
                        <button type="button" onClick={reclassificar_clientes_k_means} className="botao-processar" style={{ marginTop: '0.75rem', backgroundColor: 'var(--cor-aviso)' }}>
                            <Network size={18} />
                            Agrupar com K-Means
                        </button>
                    </form>

                    {dadosGeraisClientes.length > 0 && (
                        <div className="caixa-total-registos">
                             <div className="icone-fundo">
                                 <AlertCircle size={64} />
                             </div>
                             <p className="titulo-caixa">Total de Registos</p>
                             <p className="valor-caixa">{dadosGeraisClientes.length}</p>
                        </div>
                    )}
                </div>
            </aside>

            <main className="conteudo-principal">
                <div className="cabecalho-principal">
                    <div className="titulos-principais">
                        <h2>Painel de Análise</h2>
                        <p>Visão em tempo real das métricas de risco e limites de crédito.</p>
                    </div>
                    <div className="accoes-cabecalho">
                        <button onClick={alternarTema} className="botao-acao" aria-label="Alternar modo escuro">
                            {modoEscuro ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        <button onClick={descarregarFicheiroCSV} className="botao-acao">
                            <Download size={16} />
                            <span className="texto-botao">CSV</span>
                        </button>
                    </div>
                </div>

                <div className="grelha-graficos">
                    <div className="cartao-grafico">
                        <h3 className="titulo-cartao">
                            <span className="indicador-cor indicador-indigo"></span>
                            Renda vs Score por Cluster
                        </h3>
                        <div className="recipiente-grafico">
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={modoEscuro ? '#334155' : '#f1f5f9'} />
                                    <XAxis 
                                        type="number" 
                                        dataKey="monthly_incomes" 
                                        name="Renda Mensal" 
                                        tickFormatter={(valor) => `R$${valor/1000}k`}
                                        tick={{ fontSize: 12, fill: modoEscuro ? '#94a3b8' : '#64748b' }}
                                        axisLine={{ stroke: modoEscuro ? '#475569' : '#cbd5e1' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        type="number" 
                                        dataKey="credit_scores" 
                                        name="Score"
                                        domain={[0, 1000]}
                                        tick={{ fontSize: 12, fill: modoEscuro ? '#94a3b8' : '#64748b' }}
                                        axisLine={{ stroke: modoEscuro ? '#475569' : '#cbd5e1' }}
                                        tickLine={false}
                                    />
                                    <ZAxis type="number" dataKey="recommended_credit_limits" range={[40, 400]} name="Limite" />
                                    <RechartsTooltip content={DicaDeFerramentaPersonalizadaGraficoDispersao} />
                                    <Legend wrapperStyle={{ fontSize: '12px', color: modoEscuro ? '#f8fafc' : '#1e293b' }} />
                                    <Scatter name="Cluster 0 (Risco Médio)" data={dadosPorGrupo.grupoZero} fill="#f43f5e" opacity={0.7} />
                                    <Scatter name="Cluster 1 (Base Geral)" data={dadosPorGrupo.grupoUm} fill="#eab308" opacity={0.7} />
                                    <Scatter name="Cluster 2 (Premium)" data={dadosPorGrupo.grupoDois} fill="#3b82f6" opacity={0.7} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="nota-rodape">O tamanho da bolha representa o limite de crédito recomendado.</p>
                    </div>

                    <div className="cartao-grafico">
                        <h3 className="titulo-cartao">
                            <span className="indicador-cor indicador-esmeralda"></span>
                            Distribuição de Scores
                        </h3>
                        <div className="recipiente-grafico">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dadosHistograma} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={modoEscuro ? '#334155' : '#f1f5f9'} vertical={false} />
                                    <XAxis 
                                        dataKey="intervalo" 
                                        tick={{ fontSize: 12, fill: modoEscuro ? '#94a3b8' : '#64748b' }}
                                        axisLine={{ stroke: modoEscuro ? '#475569' : '#cbd5e1' }}
                                        tickLine={false}
                                    />
                                    <YAxis 
                                        tick={{ fontSize: 12, fill: modoEscuro ? '#94a3b8' : '#64748b' }}
                                        axisLine={{ stroke: modoEscuro ? '#475569' : '#cbd5e1' }}
                                        tickLine={false}
                                    />
                                    <RechartsTooltip 
                                        cursor={{fill: modoEscuro ? '#1e293b' : '#f8fafc'}}
                                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--cor-borda)', backgroundColor: 'var(--cor-fundo-cartao)', color: 'var(--cor-texto)' }}
                                    />
                                    <Bar dataKey="quantidade" fill="#10b981" name="Qtd Clientes" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="recipiente-tabela">
                    <div className="cabecalho-tabela">
                        <h3>Últimos Registos Processados</h3>
                    </div>
                    <div className="tabela-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>Cliente ID</th>
                                    <th>Renda Mensal</th>
                                    <th>Dívida Ativa</th>
                                    <th>Atraso</th>
                                    <th>Score</th>
                                    <th>Cluster</th>
                                    <th>Limite Recomendado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {registosRecentes.map((cliente, indice) => (
                                    <tr key={indice}>
                                        <td className="destaque-primario">{cliente.id}</td>
                                        <td>{formatarMoeda(cliente.monthly_incomes)}</td>
                                        <td>{formatarMoeda(cliente.active_debts)}</td>
                                        <td>
                                            {cliente.days_in_arrears > 0 ? (
                                                <span className="etiqueta-estado estado-perigo">
                                                    {cliente.days_in_arrears} dias
                                                </span>
                                            ) : (
                                                <span className="etiqueta-estado estado-sucesso">
                                                    <CheckCircle2 size={12} /> Em dia
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="grupo-pontuacao">
                                                <div className="barra-fundo">
                                                    <div 
                                                        className={`barra-preenchimento ${cliente.credit_scores < 400 ? 'cor-vermelho' : cliente.credit_scores < 700 ? 'cor-amarelo' : 'cor-verde'}`}
                                                        style={{ width: `${Math.min(100, (cliente.credit_scores / 1000) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="valor-pontuacao">{cliente.credit_scores}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="etiqueta-cluster">
                                                {cliente.behavioral_clusters}
                                            </span>
                                        </td>
                                        <td className="destaque-sucesso">
                                            {formatarMoeda(cliente.recommended_credit_limits)}
                                        </td>
                                    </tr>
                                ))}
                                
                                {registosRecentes.length === 0 && (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                                            Nenhum registo encontrado. Adicione clientes no painel lateral.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
