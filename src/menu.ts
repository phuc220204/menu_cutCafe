export type CategoryId = 'coffee' | 'matcha' | 'cacao' | 'tea' | 'other';
export type Temperature = 'hot' | 'cold';
export type Milk = 'dairy' | 'oat';
export type Variant = { temperature: Temperature; milk: Milk };
export interface Drink { id: string; name: string; price: number; note: string; color: string; cream?: boolean; milk?: boolean; variants?: boolean; teaBase?: 'oolong' | 'jasmine'; coconut?: boolean; }
export interface ScenePreset { camera: [number, number, number]; light: string; rim: string; }
export interface Category { id: CategoryId; name: string; english: string; eyebrow: string; title: string; description: string; background: string; accent: string; scene: ScenePreset; shape: 'bean' | 'leaf' | 'drop'; items: Drink[]; }
export const categories: Category[] = [
 { id:'coffee', name:'Cà phê', english:'COFFEE', eyebrow:'MỘT CHÚT ĐẬM ĐÀ', title:'Đậm vị,\nđúng gu.', description:'Một ngụm cà phê, một khoảng thảnh thơi.', background:'#1A120D', accent:'#D8A465', scene:{camera:[2.6,1.7,6.7],light:'#ffe1ac',rim:'#d8a465'}, shape:'bean', items:[
 {id:'black',name:'Cà phê đen',price:25000,note:'Đậm đà, nguyên bản.',color:'#402319'},
 {id:'milk-coffee',name:'Cà phê sữa',price:29000,note:'Chút đắng, chút ngọt, vừa đủ thương.',color:'#99603b',milk:true},
 {id:'salt-coffee',name:'Cà phê muối',price:35000,note:'Mặn mà một chút, lưu luyến một chút.',color:'#855139',cream:true},
 {id:'salt-cream',name:'Cà phê kem muối',price:39000,note:'Lớp kem mềm ôm vị cà phê đậm.',color:'#77503a',cream:true,milk:true},
 {id:'bac-xiu',name:'Bạc xỉu',price:35000,note:'Nhiều sữa, ít cà phê, thật dịu dàng.',color:'#ccaa7e',milk:true},
 {id:'caramel-latte',name:'Salted caramel latte',price:45000,note:'Caramel ngọt ấm, muối khẽ chạm môi.',color:'#b77d49',cream:true,milk:true}] },
 { id:'matcha',name:'Matcha',english:'MATCHA',eyebrow:'MỘT CHÚT XANH MÁT',title:'Xanh mướt,\nêm một ngày.',description:'Dịu lại một nhịp cùng sắc xanh matcha.',background:'#0F1A10',accent:'#A3BC66',scene:{camera:[-2.1,1.8,6.8],light:'#f1f4d4',rim:'#a3bc66'},shape:'leaf',items:[
 {id:'matcha-latte',name:'Matcha latte',price:45000,note:'Matcha và sữa, một cái ôm thật êm.',color:'#78954c',milk:true,variants:true},
 {id:'coldwhisk',name:'Matcha Coldwhisk',price:49000,note:'Đánh lạnh mượt mà, xanh vị matcha.',color:'#6f8644',cream:true,milk:true},
 {id:'caramel-matcha',name:'Salted caramel matcha',price:55000,note:'Xanh thanh, caramel ngọt, chút muối duyên.',color:'#829347',cream:true,milk:true},
 {id:'coco-matcha',name:'Coco matcha',price:49000,note:'Matcha gặp dừa, mát lành vừa vặn.',color:'#91a361',milk:true}] },
 { id:'cacao',name:'Cacao',english:'CACAO',eyebrow:'MỘT CHÚT NGỌT NGÀO',title:'Ngọt ngào,\nchậm rãi thôi.',description:'Cacao mềm mượt cho những phút thảnh thơi.',background:'#231210',accent:'#E0775C',scene:{camera:[1.9,1.5,7.0],light:'#ffdbbe',rim:'#e0775c'},shape:'bean',items:[
 {id:'choco-latte',name:'Choco latte',price:39000,note:'Cacao thơm nồng bên lớp sữa dịu êm.',color:'#754936',milk:true,variants:true},
 {id:'choco-mint',name:'Choco mint',price:45000,note:'Cacao đậm vị, bạc hà mát khẽ.',color:'#604333',cream:true,milk:true}] },
 { id:'tea',name:'Trà',english:'TEA',eyebrow:'MỘT CHÚT TƯƠI VUI',title:'Thanh mát,\nthêm tươi vui.',description:'Hương trà và trái cây, nhẹ nhàng mà rộn rã.',background:'#26150D',accent:'#F5AA6B',scene:{camera:[-2.3,2.0,6.8],light:'#fff0cd',rim:'#f5aa6b'},shape:'leaf',items:[
 {id:'peach',name:'Trà đào cam sả',price:39000,note:'Đào ngọt, cam thơm, sả dịu.',color:'#ce8335',teaBase:'oolong'},
 {id:'lotus',name:'Trà sen vàng',price:39000,note:'Hương sen thanh thoát trong nền ô long.',color:'#c99b47',teaBase:'oolong'},
 {id:'guava',name:'Trà ổi',price:39000,note:'Vị ổi tươi trên nền trà đậm hương.',color:'#d1a46f',teaBase:'oolong'},
 {id:'lychee',name:'Trà vải',price:39000,note:'Vải ngọt lành, trà lài thơm nhẹ.',color:'#d6b56d',teaBase:'jasmine'},
 {id:'raspberry',name:'Trà cam phúc bồn tử',price:45000,note:'Chua ngọt vui miệng, thơm hương cam.',color:'#bd6247',teaBase:'jasmine'},
 {id:'longan',name:'Trà nhãn',price:39000,note:'Nhãn ngọt dịu cùng hương lài thanh.',color:'#cba25f',teaBase:'jasmine'}] },
 { id:'other',name:'Món khác',english:'A LITTLE EXTRA',eyebrow:'MỘT CHÚT MÁT LÀNH',title:'Mộc mạc,\nmát lành.',description:'Một trái dừa, một chút vị mùa hè.',background:'#0F1819',accent:'#8FB8A8',scene:{camera:[1.2,2.0,6.7],light:'#e8f1de',rim:'#8fb8a8'},shape:'drop',items:[
 {id:'coconut',name:'Dừa tươi',price:35000,note:'Mát lành theo cách tự nhiên nhất.',color:'#a4ae68',coconut:true}] }
];
export const initialVariant: Variant = { temperature:'cold', milk:'dairy' };
export const money = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
