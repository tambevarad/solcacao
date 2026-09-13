# Planned database model

This is the Phase 1 schema design contract. Model definitions are created in Phase 1 and completed with real service behavior in Phase 2. Each owner implements its models under its feature directory. Use timestamps, explicit collections, strict schemas and serializers that remove private fields.

| Collection        | Owner | Fields and indexes                                                                                                                                                           |
| ----------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| users             | 1     | name,email(normalized unique),passwordHash,role,active, timestamps. Public User companyName resolved from partner                                                            |
| corporatePartners | 1     | userId unique ref Users, companyName; created for b2b registration; no separate credentials                                                                                  |
| addresses         | 1     | userId indexed ref Users plus Address fields; every read/upsert constrained by userId                                                                                        |
| products          | 3     | slug unique, localized name/description/ingredients/allergens,category,origin,cacaoPct,priceCents,currency,images,active; filter indexes based on observed query shapes      |
| inventory         | 3     | productId unique ref Products,availableUnits nonnegative integer; stock serialized into Product                                                                              |
| carts             | 3     | userId unique ref Users,items[{productId,quantity}],revision integer,mergeIds bounded array; atomic revision and merge updates                                               |
| orders            | 3     | optional userId,email,address snapshot,items[{productId,name snapshot,unitPriceCents,quantity}],totalCents,currency,status=simulated,requestId unique,requestHash,timestamps |
| b2bRequests       | 4     | userId ref Users,QuoteInput fields,requestId,requestHash,fileKey,fileOriginalName,fileMime,fileSize,fileDigest,status=submitted,notificationStatus; unique(userId,requestId) |
| inquiries         | 5     | InquiryInput fields,sampler item snapshots when applicable,requestId unique,requestHash,status=received,notificationStatus,timestamps                                        |

Users have many addresses and orders, one partner profile if b2b, and at most one cart. Products have one inventory record; carts/orders/inquiries reference products. B2B requests belong to a business user. Dictionaries and original static assets are version-controlled files, not Mongo collections.

Mongoose refs do not enforce foreign keys: services must validate referenced users/products, access ownership and deleted/inactive products. Checkout item snapshots preserve what was submitted after product changes. Never persist a browser File or base64 upload in request JSON. Store file metadata and a private file key.

Do not add database triggers without a concrete need; the blueprint gives no trigger specification. Use service validation and atomic writes. Registration spanning User+Partner must roll back or use a transaction so failed partner creation cannot leave a broken b2b account. If choosing transactions, local/test Mongo must be a replica set and setup docs must change in the same reviewed PR.

Student 3 creates an idempotent fixture seed using clearly fictional products with en/es data and fixed ObjectIds. Seed is explicit, never automatic on production startup and never drops collections. Other members may contribute fixture requests through that owner; no competing seed scripts.
