/* Editorial preview. Names/records below are examples from the supplied visual
   reference, NOT verified sporting facts. Replace with league-approved data.
   A champion is separate from the ten ranking positions; null means unfilled. */
window.ALASH_DATA = {
  status: 'preview',
  divisions: [
    { id:'57', name:'Наилегчайший вес', limit:'57 кг', champion:'bekzat', ranking:[] },
    { id:'61', name:'Легчайший вес', limit:'61 кг', champion:'nursultan', ranking:[] },
    { id:'66', name:'Полулёгкий вес', limit:'66 кг', champion:'sanzhar', ranking:['rustem'] },
    { id:'70', name:'Лёгкий вес', limit:'70 кг', champion:'dauren', ranking:['erzhan','bekzat-n','zamat','timur','erlan','nurbek'] },
    { id:'77', name:'Полусредний вес', limit:'77 кг', champion:'alibek', ranking:[] },
    { id:'84', name:'Средний вес', limit:'84 кг', champion:null, ranking:[] },
    { id:'93', name:'Полутяжёлый вес', limit:'93 кг', champion:null, ranking:[] },
    { id:'120', name:'Тяжёлый вес', limit:'120 кг', champion:null, ranking:[] }
  ],
  fighters: [
    {id:'dauren',name:'Даурен Куаныш',division:'70',country:'Казахстан',code:'KZ',record:[15,2,0],team:'Alash Pride Team',age:28,height:175,reach:178},
    {id:'erzhan',name:'Ержан Саттаров',division:'70',country:'Казахстан',code:'KZ',record:[12,2,0]},
    {id:'rustem',name:'Рустем Алимов',division:'66',country:'Казахстан',code:'KZ',record:[11,3,0]},
    {id:'nursultan',name:'Нурсултан Жуманов',division:'61',country:'Казахстан',code:'KZ',record:[14,2,0]},
    {id:'sanzhar',name:'Санжар Айтбек',division:'66',country:'Казахстан',code:'KZ',record:[13,3,0]},
    {id:'alibek',name:'Алибек Нургат',division:'77',country:'Казахстан',code:'KZ',record:[12,4,0]},
    {id:'bekzat',name:'Бекзат Алимхан',division:'57',country:'Казахстан',code:'KZ',record:[12,1,0]},
    {id:'bekzat-n',name:'Бекзат Нурлан',division:'70',country:'Казахстан',code:'KZ',record:[10,2,0]},
    {id:'zamat',name:'Замат Толеу',division:'70',country:'Кыргызстан',code:'KG',record:[10,3,0]},
    {id:'timur',name:'Тимур Жапаров',division:'70',country:'Казахстан',code:'KZ',record:[9,4,0]},
    {id:'erlan',name:'Ерлан Беков',division:'70',country:'Узбекистан',code:'UZ',record:[8,3,0]},
    {id:'nurbek',name:'Нурбек Ораз',division:'70',country:'Казахстан',code:'KZ',record:[8,4,0]}
  ].map(fighter => ({photo:null, fights:[], finishes:null, ...fighter}))
};
