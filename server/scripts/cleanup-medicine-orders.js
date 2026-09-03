/**
 * Cleanup script — removes ALL medicine-order data structures from the database.
 *
 * The medicine-order feature has been removed. This drops the obsolete
 * "orders" and "medicines" collections and cleans any leftover fields from
 * other collections. It NEVER touches patient, doctor, appointment, or
 * medical-report data.
 *
 * Run: cd server && node scripts/cleanup-medicine-orders.js
 */
require("dotenv").config();
const mongoose = require("mongoose");

const COLLECTIONS_TO_DROP = ["orders", "medicines"];

async function dropCollections(db) {
  for (const name of COLLECTIONS_TO_DROP) {
    try {
      await db.dropCollection(name);
      console.log(`Dropped collection: ${name}`);
    } catch (err) {
      if (err.codeName === "NamespaceNotFound") {
        console.log(`Collection not found (already clean): ${name}`);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Removes any order/medicine-specific fields that may have been left on
 * unrelated documents and any index fields tied to removed features.
 */
async function cleanStrayFields(db) {
  const collections = await db.listCollections().toArray();
  const names = collections.map((c) => c.name);

  for (const name of names) {
    let modified = false;

    // Remove leftover order/medicine fields if present on any collection.
    const unsetResult = await db.collection(name).updateMany(
      {},
      {
        $unset: {
          totalAmount: "",
          shippingAddress: "",
          paymentStatus: "",
          orderStatus: "",
          trackingId: "",
          items: "",
        },
      },
    );
    if (unsetResult.modifiedCount > 0) {
      modified = true;
      console.log(`Cleared obsolete order fields from: ${name} (${unsetResult.modifiedCount} docs)`);
    }

    // Drop any leftover field-level indexes for removed fields.
    const indexes = await db.collection(name).indexes();
    for (const index of indexes) {
      const keys = Object.keys(index.key || {});
      const isOrderRelated = keys.some((k) =>
        ["totalAmount", "shippingAddress", "paymentStatus", "orderStatus", "trackingId", "items"].includes(k),
      );
      if (isOrderRelated && index.name !== "_id_") {
        await db.collection(name).dropIndex(index.name);
        modified = true;
        console.log(`Dropped obsolete index "${index.name}" from: ${name}`);
      }
    }

    if (modified) console.log(`Cleaned: ${name}`);
  }
}

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { dbName: "homeoCareDB" });
    const db = mongoose.connection.db;

    console.log("Connected. Removing medicine-order data...");
    await dropCollections(db);
    await cleanStrayFields(db);

    console.log("Medicine-order cleanup complete.");
  } catch (err) {
    console.error("Cleanup failed:", err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

main();