# Asset management

## Uploaded HIMATU photography

Seven original 1536 × 2048 JPEGs were supplied in `public/images/figures/`. They are preserved without modification and mapped in `src/lib/assets.ts`. No Facebook CDN URLs, downloads, generated merchandise or image edits are used.

- `874109780_122155860429356138_159630139292783632_n.jpg`: Luffy Gear Five, seated.
- `862314978_122155859979356138_1917160491667365230_n.jpg`: Luffy Gear Five, action pose.
- `867155812_122155861425356138_1955209043147405711_n.jpg`: Zoro with three swords and purple effects.
- `869689144_122155861029356138_6211747126010481950_n.jpg`: Zoro with an Asura-inspired display composition.
- `867463200_122155860927356138_2040773041185832800_n.jpg`: Zoro chibi.
- `876048683_122155861521356138_4631002917188527144_n.jpg`: Ace chibi with orange hat.
- `867640567_122155861473356138_4650069518476672319_n.jpg`: Sanji chibi.

Photo subjects are visually identified. These descriptive names are not verified manufacturer/model names. Prices, stock states, authenticity and specifications remain demonstration/unconfirmed data.

## Placement and rendering

Homepage hero/editorial, product cards/details, bag thumbnails, recently viewed/wishlist and the One Piece collection use these local photos through AssetImage and Next Image. Product frames use 3:4 and object-fit contain to preserve the complete composition; collection covers may use cover. Responsive sizes, lazy loading, explicit frames and accessible alt text remain centralized. Failed images render an unavailable message instead of a dummy figurine.

Each photographed figure has one supplied image. The product gallery therefore shows a single original photograph with zoom; no alternate-angle photos are invented and unrelated variants are never combined in the same product gallery.

The seven photographed products replace the old generic demo catalogue. The retained `straw-hat-captain` URL now displays the supplied seated Luffy photograph. The four retired Naruto/JJK/Demon Slayer/Dragon Ball demo product URLs redirect to the matching collection route. Saved IDs that no longer exist are discarded by the existing store sanitizer.

## Remaining assets

All seven supplied photos are One Piece. Naruto, Dragon Ball, Jujutsu Kaisen, Demon Slayer and Other Collections use neutral typography and a photography-coming-soon state, not a photo of an unrelated figure. Custom 3D printing uses geometric process illustrations, not merchandise photography misrepresented as completed printing work. Actual printing project images, other franchises, alternate product views, verified specifications and dedicated campaign photos are still welcome.

`FigureArt.tsx` remains in source as historical development artwork but is no longer imported by runtime components. All nine supplied design-reference SVGs remain unchanged.
