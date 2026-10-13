export type Category = { id: string; name: string; discountable: boolean }
export type Product = { id: string; serial: number; name: string; price: number; unit: string; category_id: string; active: boolean; discount_percent?: number }
const groups: [string, boolean, string][] = [
['One Sound Crackers',true,`1|2 3/4" Kuruvi|20
2|3 1/2" Lakshmi|30
3|4" Lakshmi (7 Ply)|40
4|4" Lakshmi Dragon (10 Ply)|60
5|4" Hulk Deluxe (15 Ply)|88
6|5" Thunder (15 Ply)|90`],
['Double Sound Crackers',true,`7|Colour Two Sound Green|90`],
['Ground Chakkars',true,`8|Ground Chakkar Big (10 Pcs)|70
9|Ground Chakkara Ashoka (10 Pcs)|160
10|Spinner Special|220
11|Spinner Deluxe|280
12|Ground Chakkar Special|120
13|Ground Chakkar Deluxe|230
14|Whistling Wheel (5 Pcs)|210
15|Dancing Wheel (5 Pcs)|230`],
['Flower Pots',true,`16|Flower Pots Small|90
17|Flower Pots Big|150
18|Flower Pots Special|230
19|Flower Pots Asoka|320
20|Flower Pots Deluxe|330
21|Colour Koti|460
22|Colour Koti Deluxe|700
23|Lucky Red & Green (5 Pcs)|300
24|Colour zone|400
25|Miracle Pots|900`],
['Fountain Fancy Items Colour Fancy',true,`26|Chotta Bheem Fountain|170
27|Tricolor (5 Pcs)|450
28|Showers (5 Pcs)|280
30|Mega Chicklets|220
31|Lollipop (5 Pcs)|420
32|King Star (3 Pcs)|520
33|Water Splash Fountain Harmless|300
34|Tip Top|80
35|Tin Beer Fountain|280
36|Flower Rain|260
37|Tower Fountain|220`],
['Twinkling Star & Cartoon',true,`38|1 1/2 Twinkling Star|70
39|4’ Twinkling Star|180`],
['Pencil',true,`40|Bright Deluxe|120
41|Ultra Pencil|200
42|Mega Candles (2 Pcs)|320
43|Colour Smoke Candele (3 Pcs)|540
44|Special (Gun, Knife) (1 Pcs)|320`],
['Atom Bombs',true,`45|Hydro Bomb Green|100
46|King Of King Green (3ply)|180
47|Classic Bomb Green (5 ply)|250
48|Jurassic Bomb Green (7Ply)|540`],
['Rockets',true,`49|Baby Rocket|70
50|Rocket Bomb|110
51|Colour Rocket|100
52|Lunik Express|320
53|Whistle Rocket|320`],
['Bijili Crackers',true,`54|Red Bijili Small|40
55|Red Bijili Crackers|80
56|Stripped Bijili Crackers|86`],
['Running Crackers',true,`57|28*1000 Chorsha Crackers|30
58|28 X 1000 Gaint Crackers|50
59|56 x 1000 Gaint Crackers|80`],
['Deluxe Crackers',true,`60|24 x 250 Deluxe Crackers|70
61|28 x 250 Deluxe Crackers|80
62|50 x 100 Deluxe Crackers|200
63|100 Deluxe Crackers (Mega Size)|400`],
['Redtape Crackers',true,`64|Light Flash (Digital Lar)|90
66|3h Redtape Crackers|220
67|6h Redtape Crackers|400
68|1k Redtape Crackers|1200
69|2k Redtape Crackers|2400
70|5k Redtape Crackers|4000
71|10k Redtape Crackers|6600`],
['Colourful Fancy Items (Pipe)',true,`72|Chotta Fancy|150
73|Colour Collection (5 Pcs)|340
74|3G 1" Aerial Fancy (3 Pcs)|340
75|3 Pieces Fancy (3 pcs /Box)|660
76|Fancy (2" PIPE single pce Pack)|270
77|Fancy (2" PIPE 2 pcs Pack)|520
78|Penta Magic (5 PCS)|280
79|Mega Fancy (3 1/2" Special) (UV)|750
80|Mega Fancy (3 1/2" PIPE) (Single ball)|550
81|Mega Fancy (3 1/2" PIPE) (Double ball)|750
82|Mega Fancy (3 1/2" PIPE) (2 Pack)|1100
83|Mega Fancy (4" PIPE) (1 Pcs Pack)|750
84|Mega Fancy (4" PIPE) Niagara|950
85|Mega Fancy (5" PIPE) (1 Pcs Pack)|1700`],
['Repeating Shots',true,`86|7 Shot In Colour (5 pcs / Box)|280
87|12 Star In Rider|260
88|12 Star In Cracking - Multi colour|380`],
['Multi Colour Continoues Shots',true,`89|15 - Shot in MultiColour (Long Size)|560
90|25 - Shot in MultiColour (Long Size)|950
91|25 - Shot Crackling|950
92|30 - Shot In MultiColour|1200
93|60 - Shot in MultiColour|2400
94|100 - Shot In Multicolour|3200
95|120 - Shot in MultiColour|4000
96|240 - Shot in MultiColour|7400
97|40 - Mega Shot MultiColour (2" Size)|10200
98|20 - Mega Shot MultiColour (3" Size)|10200
99|10 x 10 - MultiColour|9500`],
['Whistling Shots One By One',true,`100|Whistling 12 Shot|780
101|Whistling 28 Shot|1400
102|Whistling 50 Shot|2500
103|Whistling 100 Shot|4750`],
['Fancy Fireworks & Whistling Items',true,`104|Photo Flash (5 Pcs / Box)|240
105|Electric Stone|30
106|Siren (3 pcs / Box)|340
107|Dancing Butterfly (10 Pcs)|220
108|Dancing Peacock (1 Pcs)|360
109|Dancing Peacock Mega (1 Pcs)|900
110|Assorted Cartoons|60
111|Drone (5 Pcs)|360
112|Bambaram|320
113|Bat & Ball (1 Pcs)|400`],
['Sparklers',true,`114|7 Cm Electric Sparklers|20
115|7 Cm Colour Sparklers|20
116|7 Cm Red Sparklers|30
117|7 Cm Green Sparklers|30
118|10 Cm Electric Sparklers|40
119|10 Cm Colour Sparklers|40
120|10 Cm Red Sparklers|50
121|10 Cm Green Sparklers|50
122|12 Cm Electric Sparklers|50
123|12 Cm Colour Sparklers|50
124|12 Cm Red Sparklers|60
125|12 Cm Green Sparklers|60
126|15 Cm Electric Sparklers|80
127|15 Cm Colour Sparklers|80
128|15 Cm Red Sparklers|90
129|15 Cm Green Sparklers|90
131|30 Cm Electric Sparklers|80
132|30 CM Colour Sparklers|80
133|30 CM Red Sparklers|90
134|30 CM Green Sparklers|90
136|50 Cm Electric Sparklers|300
137|50 Cm Colour Sparklers|320
138|50 Cm Multimix Sparklers|340
141|Rotator Sparklers|400`],
['Gift Box',false,`142|Zig Zag (15 items)|300
143|GTA (21 items)|420
144|Jack Sparrow (31 items)|570
145|Super Man (41 items)|750
146|Lord Ganesha (51 items)|860
147|Om Muruga (61 items)|1200`],
['Colour Matches',false,`148|JIL - JIL (Match Box)|40
149|Colour Torch (Match Box)|80
150|Super 6 (Deluxe Match Box)|110
151|Blooms Matches (Mega Match Box)|140
152|Nokia (Lamp Match Box)|220`],
['Roll Cap and Paper Bomb Items',true,`153|Roll Cap|100
156|Ring Cap|10
157|Money Money Paper Bomb (Currency Note)|450
158|Adiyal Paper Bomb (1/4kg -1Pce)|80
159|Adiyal Paper Bomb (1/2kg -1Pce)|160
160|Adiyal Paper Bomb (1kg -1Pce)|300
161|Avathar Paper Bomb|450
162|Ganesh Paper Bomb|180
163|King Rider|450`],
]
export const seedCategories: Category[] = groups.map(([name,discountable],i)=>({id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,name,discountable}))
export const seedProducts: Product[] = groups.flatMap(([, ,rows],i)=>rows.split('\n').map(row=>{const [serial,name,price]=row.split('|');const n=Number(serial);return {id:`10000000-0000-4000-8000-${serial.padStart(12,'0')}`,serial:n,name,price:Number(price),unit:n<=7 || (n>=57&&n<=63)?'1 pkt':n>=54&&n<=56?'1 Bag':n===87||n===88?'1 pcs':'1 Box',category_id:seedCategories[i].id,active:true}}))
