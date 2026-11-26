import json,html,sys
D=json.load(open(sys.argv[1]))
it=D['items'];N=lambda k:it.get(k,{}).get('name',k)
E=html.escape
SEAS={'spring':'Primavera','summer':'Verão','autumn':'Outono','winter':'Inverno'}
def table(head,rows,cls=''):
  h=''.join(f'<th>{E(x)}</th>' for x in head)
  b=''.join('<tr>'+''.join(f'<td>{c}</td>' for c in r)+'</tr>' for r in rows)
  return f'<div class="tbl {cls}"><table><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table></div>'
def cost(d):return ', '.join(f'{E(N(k))} {v}' for k,v in d.items())
# Crops
crow=[]
for c in D['crops']:
  rg=c.get('regrow')
  crow.append([f'<b>{E(c["name"])}</b>',' · '.join(SEAS[s] for s in c['seasons']),f'{c["seedPrice"]} C',f'{c["salePrice"]} C',f'{c["days"]} dias',f'a cada {rg} dias' if rg else '—'])
crops_tbl=table(['Planta','Estações','Semente','Venda','Fica pronta','Rebrota'],crow,'crops')
# Dishes
stmap={'oven':'Forno de barro (ou fogão da cozinha nova)','campfire':'Fogueira'}
srcmap={'mine':'Anotação perdida na Mina','survivors':'Sobreviventes do acampamento','oldMap':'Segredo do mapa antigo','campfire':'Já se sabe','helena':'Helena ensina'}
drow=[]
for r in sorted(D['dishes'],key=lambda r:-r['price']):
  st=stmap.get(r.get('station'),'Fogão')
  drow.append([f'<b>{E(N(r["id"]))}</b>',cost(r['ingredients']),st,f'{r["price"]} C',f'+{r["vigor"]}',srcmap.get(r.get('source') or 'helena','')])
dish_tbl=table(['Prato','Ingredientes','Onde','Vale','Vigor','Como aprender'],drow)
# Machines
mnames={k:v['name'] for k,v in D['machines'].items()}
npcN={'bento':'Bento','tobias':'Tobias','helena':'Helena','augusto':'Augusto','icaro':'Ícaro'}
mrow=[]
for k,m in D['machines'].items():
  if k=='beehive':continue
  recs=[r for r in D['machineRecipes'] if r['machine']==k and not r['id'].startswith('oven-')]
  what='; '.join(f"{r['amount']} {E(N(r['input']))}{(' + '+cost(r['extra'])) if r.get('extra') else ''} → {r['quantity']} {E(N(r['output']))} ({r['minutes']//60} h)" for r in recs) or 'Pratos de forno (12 h cada)'
  mrow.append([f'<b>{E(m["name"])}</b>',what,f'{npcN.get(m["npc"],m["npc"])} · {m["learnFee"]} C',cost(m['cost'])])
mach_tbl=table(['Máquina','O que faz','Quem ensina','Materiais para montar'],mrow)
# Crafting
skip=set()
rrow=[[f'<b>{E(x.get("name"))}</b>',cost(x.get('cost') or {}),E(x.get('description',''))] for x in D['recipes']]
craft_tbl=table(['Receita','Materiais','Para que serve'],rrow,'craft')
# Fish
rar={'common':'Comum','uncommon':'Incomum','rare':'Raro','very-rare':'Muito raro'}
frow=[[f'<b>{E(f["name"])}</b>',rar[f['rarity']],f'{f["minCm"]}–{f["maxCm"]} cm',E(f['description'])] for f in D['fish']]
fish_tbl=table(['Peixe','Raridade','Tamanho','Como é'],frow)
# Merchants
mer=[]
owners={'general':'Armazém do Augusto','seeds':'Sementes da Rosa','blacksmith':'Ferraria do Bento','herbalist':'Ervas da Amélia','carpenter':'Carpintaria do Tobias','traveler':'Nilo, o viajante','tailor':'Ateliê da Celina','fisher':'Cabana do Damião','inn':'Pousada da Helena','mechanic':'Oficina do Ícaro'}
for k,m in D['merchants'].items():
  sells=', '.join(f'{E(N(a))} {b}' for a,b in (m['buy'] or {}).items() if not a.endswith('Seeds') or k!='seeds')
  if k=='seeds':sells='Todas as sementes da horta, adubo (22 C)'
  mer.append([f'<b>{E(m["name"])}</b>',owners.get(k,k),sells,E(m.get('description') or '')])
shop_tbl=table(['Morador','Loja','Vende (preço em coroas)','O que compra de você'],mer)
# Services
npcFull={'rosa':'Rosa','augusto':'Augusto','tobias':'Tobias','amelia':'Amélia','nilo':'Nilo','helena':'Helena','celina':'Celina','damiao':'Damião','icaro':'Ícaro','bento':'Bento','lucia':'Lúcia','jonas':'Jonas'}
srow=[]
for n,v in D['services'].items():
  if not v:continue
  labs=[o['label'] for o in v]
  labs=[l for l in labs if not l.startswith('Reparar ')]+(['Reparar ferramentas, vara, rede e tesoura'] if n=='bento' else [])
  srow.append([f'<b>{npcFull[n]}</b>',' · '.join(E(l) for l in labs)])
serv_tbl=table(['Morador','Serviços'],srow)
# Projects
prow=[[f'<b>{E(p["name"])}</b>',npcFull[p['npc']],f'{p["coins"]:,}'.replace(',','.')+' C',cost(p['items']),f'{p["days"]} dias',E(p['description'])] for p in D['projects']]
proj_tbl=table(['Obra','Com quem','Coroas','Materiais','Fica pronta em','O que muda'],prow)
# Farm buildings
lab=D['labor'];frm=[]
anim={'coop':'Galinhas e patos','barn':'Vacas','stable':'1 cavalo','aprisco':'Ovelhas e cabras','pigsty':'Porcos','silo':'Palha (até 240)'}
for k,v in D['farm'].items():
  l=lab.get(k);frm.append([f'<b>{E(v["name"])}</b>',anim[k],str(v['capacity']) if k!='silo' else '—',cost(v['cost']),(f'{l:,}'.replace(',','.')+' C') if l else '—'])
farm_tbl=table(['Construção','Para quem','Vagas','Materiais','Mão de obra do Tobias'],frm)
# Festivals
fest=D['festivals'][0][1];frow2=[]
for f in fest:
  opts=[N(o) for o in f['contest']['options']]
  o=', '.join(opts) if len(opts)<8 else 'qualquer prato'
  rw=f"{f['reward']['coins']} C + "+cost(f['reward']['items'])
  frow2.append([f'<b>{E(f["name"])}</b>',f"{['Primavera','Verão','Outono','Inverno'][f['seasonIndex']]} {f['dayOfSeason']}",f"{f['start']//60}h às {f['end']//60}h",{'village':'Praça da Vila','coast':'Costa das Marés'}[f['place']],f"{E(f['contest']['name'])}: {f['contest']['amount']} × {E(o)}",E(rw)])
fest_tbl=table(['Festa','Dia','Horário','Onde','Concurso','Prêmio'],frow2)
# Missions (capítulos e conquistas, direto de src/data/missions.ts)
chs=D['chapters'];mrow=[];n=0
for c in chs:
  if c['id']=='vale-renasceu':lab='Final'
  elif c['side']:lab='Em paralelo'
  else:n+=1;lab=f'Capítulo {n}'
  mrow.append([f'<b>{E(c["title"])}</b><br><small>{lab}</small>','<br>'.join('• '+E(x) for x in c['missions']),f'<b>{E(c["achievement"])}</b><br><small>{E(c["description"])}</small>'])
miss_tbl=table(['Capítulo','Missões','Conquista'],mrow)
tpl=open(sys.argv[2]).read()
for k,v in dict(CROPS=crops_tbl,DISHES=dish_tbl,MACHINES=mach_tbl,CRAFT=craft_tbl,FISH=fish_tbl,SHOPS=shop_tbl,SERVICES=serv_tbl,PROJECTS=proj_tbl,FARM=farm_tbl,FEST=fest_tbl,MISSIONS=miss_tbl,NCAP=str(len(chs)),NMIS=str(sum(len(c['missions']) for c in chs))).items():tpl=tpl.replace('{{'+k+'}}',v)
open(sys.argv[3],'w').write(tpl)
