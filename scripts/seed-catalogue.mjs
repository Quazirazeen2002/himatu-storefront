import { Pool } from "pg";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx !== -1) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      env[key] = val;
    }
  }
  return env;
}

const env = parseEnv(path.resolve(__dirname, "../apps/api/.env"));
const caPath = path.resolve(__dirname, "../apps/api/certs/supabase-ca.crt");
const ca = fs.existsSync(caPath) ? fs.readFileSync(caPath, "utf8") : undefined;

const rawUrl = env.DIRECT_URL || env.DATABASE_URL;
const parsedUrl = new URL(rawUrl);
parsedUrl.searchParams.delete("sslmode");
parsedUrl.searchParams.delete("sslrootcert");

const pool = new Pool({
  connectionString: parsedUrl.toString(),
  ssl: ca
    ? { ca, rejectUnauthorized: true }
    : { rejectUnauthorized: false },
});

async function seed() {
  console.log("Seeding HIMATU categories and products...");

  // 1. Promote owner to ADMIN
  const ownerEmail = env.SMTP_USER || "razeenjubair10@gmail.com";
  const userRes = await pool.query(
    `UPDATE "UserProfile" SET role = 'ADMIN' WHERE email = $1 RETURNING id, "fullName", email, role`,
    [ownerEmail]
  );
  if (userRes.rows.length > 0) {
    console.log(`Promoted owner to ADMIN:`, userRes.rows[0]);
  } else {
    console.log(`No user profile found for ${ownerEmail} yet (will be admin when synchronized).`);
  }

  // 2. Categories
  const categories = [
    {
      name: "One Piece",
      slug: "one-piece",
      description: "Adventure without limits. High-grade authentic statues and figures from the Grand Line.",
      imageUrl: "/images/figures/862314978_122155859979356138_1917160491667365230_n.jpg",
      displayOrder: 1,
    },
    {
      name: "Naruto",
      slug: "naruto",
      description: "The will of fire that never fades. Detailed Shinobi collectible figures.",
      imageUrl: "/images/figures/867463200_122155860927356138_2040773041185832800_n.jpg",
      displayOrder: 2,
    },
    {
      name: "Dragon Ball",
      slug: "dragon-ball",
      description: "Beyond mortal limits. Super Saiyan power and battle poses.",
      imageUrl: "/images/figures/874109780_122155860429356138_159630139292783632_n.jpg",
      displayOrder: 3,
    },
    {
      name: "Jujutsu Kaisen",
      slug: "jujutsu-kaisen",
      description: "Enter the extraordinary realm of cursed energy and special grade sorcerers.",
      imageUrl: "/images/figures/867640567_122155861473356138_4650069518476672319_n.jpg",
      displayOrder: 4,
    },
    {
      name: "Demon Slayer",
      slug: "demon-slayer",
      description: "A spirit that never breaks. Nichirin blade techniques captured in museum-grade resin.",
      imageUrl: "/images/figures/869689144_122155861029356138_6211747126010481950_n.jpg",
      displayOrder: 5,
    },
    {
      name: "Other Anime",
      slug: "other-collections",
      description: "Rare and exclusive anime collectibles spanning legendary series across Japan.",
      imageUrl: "/images/figures/876048683_122155861521356138_4631002917188527144_n.jpg",
      displayOrder: 6,
    },
  ];

  const categoryMap = new Map();

  for (const cat of categories) {
    const res = await pool.query(
      `INSERT INTO "Category" (id, name, slug, description, "imageUrl", "isActive", "displayOrder", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, true, $5, NOW())
       ON CONFLICT (slug) DO UPDATE
       SET name = EXCLUDED.name, description = EXCLUDED.description, "imageUrl" = EXCLUDED."imageUrl", "displayOrder" = EXCLUDED."displayOrder", "isActive" = true
       RETURNING id, slug`,
      [cat.name, cat.slug, cat.description, cat.imageUrl, cat.displayOrder]
    );
    categoryMap.set(cat.slug, res.rows[0].id);
  }
  console.log(`Configured ${categoryMap.size} categories.`);

  // 3. Products
  const onePieceCatId = categoryMap.get("one-piece");
  const products = [
    {
      name: "Luffy · Gear Five",
      slug: "straw-hat-captain",
      sku: "HMT-OP-LGF-001",
      shortDescription: "Luffy in Gear Five, seated with dynamic blue cloud effect pieces.",
      description: "Authentic collectible statue of Monkey D. Luffy awakening Gear Five. Features cloud-like hair sculpted in translucent pearl white, signature joyous smile, seated pose on an engraved display pedestal, and vibrant blue energy swirling effect pieces. Hand-finished paintwork faithfully preserves the iconic Sun God Nika design.",
      price: 6500,
      salePrice: 5900,
      categoryId: onePieceCatId,
      isFeatured: true,
      stock: 12,
      specifications: {
        Scale: "1/8 Scale Statue",
        Height: "22 cm",
        Material: "PVC & Translucent ABS",
        Manufacturer: "Bandai Spirits",
        Series: "One Piece: Wano Kuni Arc",
        Edition: "Limited Standard Edition",
      },
      images: [
        {
          imageUrl: "/images/figures/862314978_122155859979356138_1917160491667365230_n.jpg",
          altText: "Luffy Gear Five seated pose with blue effect pieces",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Zoro · Three Sword Style",
      slug: "zoro-three-sword-style",
      sku: "HMT-OP-Z3S-002",
      shortDescription: "Zoro in a dynamic three-sword combat stance with purple aura effect pieces.",
      description: "Roronoa Zoro unleashed in his legendary Santoryu (Three-Sword Style) battle stance. Features Wado Ichimonji, Sandai Kitetsu, and Enma coated in conqueror's armament haki, enveloped by dark purple aura effect parts with metallic sheen. Master-grade sculpting highlights muscular anatomy and wind-swept green coat.",
      price: 4800,
      salePrice: null,
      categoryId: onePieceCatId,
      isFeatured: true,
      stock: 8,
      specifications: {
        Scale: "1/7 Scale Action Figure",
        Height: "26 cm",
        Material: "High-Grade PVC",
        Manufacturer: "Megahouse P.O.P",
        Series: "One Piece: Raid on Onigashima",
        Edition: "First Run Collector Edition",
      },
      images: [
        {
          imageUrl: "/images/figures/867155812_122155861425356138_1955209043147405711_n.jpg",
          altText: "Zoro Three Sword Style combat posture with purple aura",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Ace · Chibi Figure",
      slug: "ace-chibi",
      sku: "HMT-OP-ACE-003",
      shortDescription: "Smiling chibi Portgas D. Ace sporting his iconic orange hat with skull beads.",
      description: "A collector favorite chibi rendition of 'Fire Fist' Portgas D. Ace. Captures Ace's warm adventurous smile, signature orange cowboy hat with smiling and frowning medallions, bead necklace, dagger scabbard, and miniature flame base. Compact yet extraordinarily sharp in sculpting detail.",
      price: 7200,
      salePrice: 6800,
      categoryId: onePieceCatId,
      isFeatured: true,
      stock: 15,
      specifications: {
        Scale: "Super-Deformed Chibi",
        Height: "14 cm",
        Material: "Solid PVC & Matte ABS",
        Manufacturer: "Good Smile Company",
        Series: "One Piece: Whitebeard Pirates",
        Edition: "Special Anniversary Release",
      },
      images: [
        {
          imageUrl: "/images/figures/867463200_122155860927356138_2040773041185832800_n.jpg",
          altText: "Ace Chibi Figure smiling with orange hat",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Zoro · Asura Display",
      slug: "zoro-asura",
      sku: "HMT-OP-ZAS-004",
      shortDescription: "Zoro in an elaborate display composition with multi-arm Asura manifestation.",
      description: "Museum-level display piece depicting Zoro manifesting the nine-sword demonic entity Kyutoryu: Asura. Triple torso illusion and nine dual-toned blades cast in pearlescent shading with translucent smoke effects wrapping the rocky diorama base. An imposing centerpiece for serious One Piece collectors.",
      price: 5900,
      salePrice: null,
      categoryId: onePieceCatId,
      isFeatured: false,
      stock: 6,
      specifications: {
        Scale: "1/6 Diorama Statue",
        Height: "32 cm",
        Material: "Polystone Resin & PVC",
        Manufacturer: "Tsume Art Collab",
        Series: "One Piece: Wano Climax",
        Edition: "Numbered Limited Run",
      },
      images: [
        {
          imageUrl: "/images/figures/867640567_122155861473356138_4650069518476672319_n.jpg",
          altText: "Zoro Asura display figure with intricate multi-arm backdrop",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Sanji · Chibi Figure",
      slug: "sanji-chibi",
      sku: "HMT-OP-SAN-005",
      shortDescription: "A smiling chibi Sanji resting chin on his hands with playful chivalrous pose.",
      description: "Delightful chibi sculpture of the Straw Hat crew's master chef Sanji. Depicted resting his chin contemplatively on both hands with signature swirling eyebrow, immaculate black suit with golden tie clip, and heart-accented base. Perfectly complements the Ace and Luffy chibi series.",
      price: 6200,
      salePrice: null,
      categoryId: onePieceCatId,
      isFeatured: false,
      stock: 10,
      specifications: {
        Scale: "Super-Deformed Chibi",
        Height: "13 cm",
        Material: "Solid PVC",
        Manufacturer: "Good Smile Company",
        Series: "One Piece: Whole Cake Island",
        Edition: "Official Standard Edition",
      },
      images: [
        {
          imageUrl: "/images/figures/869689144_122155861029356138_6211747126010481950_n.jpg",
          altText: "Sanji Chibi Figure with smiling expression",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Luffy · Gear Five Action",
      slug: "luffy-gear-five-action",
      sku: "HMT-OP-LGA-006",
      shortDescription: "Dynamic airborne Gear Five Luffy surrounded by vivid lightning and flame effects.",
      description: "High-octane action pose of Monkey D. Luffy delivering a finishing blow in Gear Five form. Featuring mid-air flight dynamics, stretched rubber limb effects, vibrant pink and lightning-yellow burst plates, and a translucent cloud swirl mounting stand. Engineered with high impact resistance and vibrant saturation.",
      price: 6500,
      salePrice: null,
      categoryId: onePieceCatId,
      isFeatured: true,
      stock: 7,
      specifications: {
        Scale: "1/8 Scale Dynamic Figure",
        Height: "24 cm",
        Material: "PVC & Impact ABS",
        Manufacturer: "Banpresto Ichibankuji",
        Series: "One Piece: Onigashima Awakening",
        Edition: "Masterlise Extra",
      },
      images: [
        {
          imageUrl: "/images/figures/874109780_122155860429356138_159630139292783632_n.jpg",
          altText: "Luffy Gear Five Action in dynamic leap with lightning effects",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "Demon Slayer · Hashira Collection",
      slug: "demon-slayer-hashira",
      sku: "HMT-DS-HAS-007",
      shortDescription: "Museum scale Hashira swordsman statue with translucent water breathing dragon.",
      description: "Intricately detailed figure showcasing master Nichirin swordsmanship from Demon Slayer: Kimetsu no Yaiba. Features translucent Water Breathing dragon effects coiling around the stance, haori pattern precision painting, and a rocky gravel display pedestal.",
      price: 7800,
      salePrice: 7200,
      categoryId: categoryMap.get("demon-slayer"),
      isFeatured: true,
      stock: 5,
      specifications: {
        Scale: "1/8 Scale Statue",
        Height: "25 cm",
        Material: "PVC & ABS",
        Manufacturer: "Aniplex+",
        Series: "Demon Slayer: Kimetsu no Yaiba",
        Edition: "Collector Edition",
      },
      images: [
        {
          imageUrl: "/images/figures/876048683_122155861521356138_4631002917188527144_n.jpg",
          altText: "Demon Slayer swordsman figure with breathing effects",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
    {
      name: "HIMATU Collector Pin · Straw Hat Emblem",
      slug: "collector-pin",
      sku: "HMT-ACC-PIN-008",
      shortDescription: "Official HIMATU collector emblem pin. Low price 20 TK item for purchase & order testing.",
      description: "Official HIMATU collector enamel pin featuring the iconic Straw Hat emblem with gold-tone metal plating and dual rubber clutch backing. Low-price ৳ 20 item designed for verifying checkout, payment gateways, and order placement workflow.",
      price: 20,
      salePrice: null,
      categoryId: onePieceCatId,
      isFeatured: true,
      stock: 100,
      specifications: {
        Type: "Collector Enamel Pin",
        Material: "Hard Enamel & Zinc Alloy",
        Dimensions: "35 mm x 30 mm",
        Finish: "Gold Plated & Polished",
        Edition: "HIMATU Collector Edition",
      },
      images: [
        {
          imageUrl: "/images/figures/874109780_122155860429356138_159630139292783632_n.jpg",
          altText: "HIMATU Collector Pin Straw Hat Emblem 20 TK test item",
          isPrimary: true,
          sortOrder: 0,
        },
      ],
    },
  ];

  for (const prod of products) {
    const prodRes = await pool.query(
      `INSERT INTO "Product" (
        id, name, slug, sku, "shortDescription", description, price, "salePrice", currency,
        "categoryId", specifications, "isActive", "isFeatured", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, 'BDT',
        $8, $9, true, $10, NOW(), NOW()
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        sku = EXCLUDED.sku,
        "shortDescription" = EXCLUDED."shortDescription",
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        "salePrice" = EXCLUDED."salePrice",
        "categoryId" = EXCLUDED."categoryId",
        specifications = EXCLUDED.specifications,
        "isActive" = true,
        "isFeatured" = EXCLUDED."isFeatured",
        "updatedAt" = NOW()
      RETURNING id, name, slug`,
      [
        prod.name,
        prod.slug,
        prod.sku,
        prod.shortDescription,
        prod.description,
        prod.price,
        prod.salePrice,
        prod.categoryId,
        JSON.stringify(prod.specifications),
        prod.isFeatured,
      ]
    );

    const productId = prodRes.rows[0].id;

    // Inventory
    await pool.query(
      `INSERT INTO "Inventory" (id, "productId", quantity, "reservedQuantity", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 0, NOW())
       ON CONFLICT ("productId") DO UPDATE SET
         quantity = EXCLUDED.quantity,
         "updatedAt" = NOW()`,
      [productId, prod.stock]
    );

    // Delete existing images to avoid duplicates and re-insert
    await pool.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);

    for (const img of prod.images) {
      await pool.query(
        `INSERT INTO "ProductImage" (id, "productId", "imageUrl", "altText", "sortOrder", "isPrimary", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
        [productId, img.imageUrl, img.altText, img.sortOrder, img.isPrimary]
      );
    }

    console.log(`Seeded product: ${prod.name} (${prod.slug}) with stock: ${prod.stock}`);
  }

  console.log("Seeding completed successfully!");
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
