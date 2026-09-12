# Original project blueprint text

Extracted verbatim from the user-supplied SolCacao requirements DOCX. Formatting is simplified. Current phase execution follows course-phases.md and the later screenshot, not the week labels below.

PROJECT BLUEPRINT & REQUIREMENTS
SolCacao Artisanal Chocolate Platform

A Full-Stack Bilingual Web Application for D2C Retail and B2B Wholesale Management

──────────────────────────────────────────────────

1. Executive Summary & Brand Strategy

SolCacao is a premium culinary brand specializing in organic, single-origin cacao. To capture market share in both individual consumer and enterprise segments, the brand requires a highly responsive, bilingual (Spanish/English) web application. This platform serves a dual-purpose business model, uniting Direct-to-Consumer (D2C) retail shopping with high-volume Business-to-Business (B2B) corporate confectionery operations.

The application is engineered from the ground up to support a component-based architecture, utilizing a modern tech stack to ensure quick load times, excellent search engine optimization, and robust scalability. The project is structured for a team of exactly five developers, each leading a distinct subsystem while collaborating on system integration, localization, and quality assurance.

2. System Architecture & Tech Stack

To deliver a modern Single-Page Application (SPA) experience, the front-end interface is decoupled from the backend logic, communicating entirely via stateless RESTful JSON application programming interfaces (APIs). This model ensures that server computation is dedicated purely to data validation, business logic, security, and persistence, while the user's browser handles UI rendering dynamically.

Table 2.1: Unified Tech Stack Specifications

Layer | Technology | Strategic Rationale
Client-Side Framework | React 18+ (Hooks, Context) | Enables highly modular UI components, efficient local state management, and declarative DOM updates.
Styling & Icons | Tailwind CSS & Lucide React | Allows rapid development of utility-first responsive grids, robust custom themes, and consistent iconography.
Server-Side Runtime | Node.js with Express.js | Provides a non-blocking, event-driven, single-threaded backend that scales seamlessly for high-concurrency requests.
Database Engine | MongoDB (via Mongoose ODM) | Stores complex, nested document schemas (such as shopping carts, products, and localized descriptions) without rigid table structures.
Identity & Security | JSON Web Tokens (JWT) & Bcrypt | Ensures secure, stateless authentication, encrypted credential storage, and role-based route access controls.

3. Dual-Channel Operations Strategy

SolCacao does not operate as a conventional storefront. Instead, it coordinates two completely distinct transaction channels, requiring separate user experiences, data validation pipelines, and database logic.

Direct-to-Consumer (D2C) Retail: Individual consumers explore a sleek catalog of single-origin bars, artisanal truffle collections, and seasonal chocolate bars. The catalog features instant multi-criteria filtering (cacao percentage range, origin, price), interactive sliders, and an intuitive side-drawer shopping cart. Guest checkout is supported alongside registered accounts, backed by an interactive shopping cart session sync upon user login.

Business-to-Business (B2B) Enterprise: Wholesale partners, luxury hotels, and corporate events access customized B2B portals. This channel highlights the brand's premium confection services, including custom corporate chocolate molds, personalized luxury packaging design, and white-label branding. The cornerstone of the B2B portal is a 4-step custom wizard allowing businesses to select cacao profiles, upload custom brand vectors or tech packs, designate customized wholesale packaging, and submit an automated request for custom manufacturing quotes.

4. Technical Division of Labor (5 Student Roles)

To mimic modern software engineering divisions, the work is strictly partitioned among five roles. Each student takes complete ownership of a client-side subsystem and its corresponding server-side schemas, validation, and REST endpoints.

Student 1: Authentication, Security & Databases

• Front-End Responsibilities: Develop user entry systems, auth modals, registration interfaces, and profile management panels. Configure distinct flows for retail consumers vs. corporate brands.

• Back-End Responsibilities: Design the central database schema representing Users, Corporate Partners, and Address models. Write secure backend middleware handling Bcrypt hashing, JWT generation/verification, and strict role-based route guards.

🤖 Recommended AI Collaboration Prompt: "Act as a Database Architect & Security Engineer. Write a secure MongoDB mongoose schema for a User model supporting 'Retail' and 'B2B' accounts. Also, write a Node.js Express middleware function that validates JWT Bearer tokens from incoming headers, handling expiration and attaching user payloads."

Student 2: Core Layout, Navigation & Localization

• Front-End Responsibilities: Construct the application's core shell, including a sticky navigation bar with search triggers, a responsive slide-out mobile menu, global footer, and client-side routing. Implement a global localization toggle.

• Back-End Responsibilities: Build API routes that serve dynamic, server-side localization dictionaries to the client. Set up asset routing templates and static file configurations on the server.

🤖 Recommended AI Collaboration Prompt: "Act as a Frontend Layout Architect. Generate a responsive sticky navbar component in React 18 with Tailwind CSS. It must support a desktop menu, a mobile sliding drawer (state-controlled), a language switcher toggle, and dynamic cart count. Also show how to set up react-router-dom v6 configuration supporting localized paths like '/es/catalog' vs '/en/catalog'."

Student 3: Gourmet Catalog, Search & Cart State

• Front-End Responsibilities: Create the product catalog showcase. Implement responsive product grids, individual product detail cards, multi-dimensional filter sidebars (origins, percentages), and a slide-out shopping cart drawer.

• Back-End Responsibilities: Design Product, Inventory, and Cart collection schemas. Develop GET /api/products supporting server-side query filters, pagination, and sorting. Implement endpoints for active shopping cart persistence and guest session merging.

🤖 Recommended AI Collaboration Prompt: "Act as a Backend & State Engineer. Write a robust Node.js Express handler for a GET '/api/products' route that parses query params ('cacaoPct', 'origin', 'search') and performs dynamic DB searches with pagination. Also, generate a useReducer React hook that handles complex cart state actions including ADD, REMOVE, UPDATE, and local storage persistence."

Student 4: B2B Services & Step-by-Step Customization Wizard

• Front-End Responsibilities: Design the landing homepage featuring hero slides and seasonal cacao showcases. Code the B2B Wholesale page, showcasing custom confectionery services. Build a highly interactive 4-step wizard for custom B2B orders.

• Back-End Responsibilities: Model B2B Custom Request collections. Build POST endpoints capable of handling multipart form-data (metadata + technical design uploads). Setup file storage logic (AWS S3 or Local disk) for custom corporate mold files.

🤖 Recommended AI Collaboration Prompt: "Act as an Interactive UX Developer. Generate a highly polished, responsive 4-step horizontal wizard component in Tailwind CSS for custom ordering. The steps must be interactive, showing completed states. Also, write the Node.js API controller route that uses 'multer' to process corporate requests containing textual configurations and an uploaded PDF vector brand logo."

Student 5: Personalization Forms, Contacts & Notification Bridges

• Front-End Responsibilities: Build robust contact pages, feedback systems, custom chocolate sampler builders, and informational static views. Integrate dynamic external messaging hooks (automated WhatsApp redirection links).

• Back-End Responsibilities: Write strict validation models (e.g., using Joi/Zod) for user inquiry entries. Configure SMTP mail server bridges on the Node.js backend using Nodemailer to securely route wholesale and support inquiries to SolCacao teams.

🤖 Recommended AI Collaboration Prompt: "Act as a Full-Stack Integration Developer. Write a complete React customer support form component with validation checks for email, message, and category. Also write a backend Node.js helper using 'nodemailer' that receives the validated payload and sends a professional HTML email with the customer's B2B custom chocolate sample request."

5. Core RESTful API Routes

To ensure seamless full-stack integration, students must build and maintain standard, RESTful endpoint schemas. All requests must pass content validation models, returning standard HTTP status codes and JSON payloads.

Table 5.1: Database-Driven API Specifications

Method | Endpoint Path | Access | Payload Expectation | Success Code
POST | /api/auth/register | Public | JSON user details & account type selection | 201 Created
POST | /api/auth/login | Public | JSON credentials (email & password) | 200 OK (with JWT)
GET | /api/products | Public | URL query filters (origin, percentage) | 200 OK (JSON List)
POST | /api/cart/persist | User | JSON array representing full cart state | 200 OK
POST | /api/b2b/quote | Partner | Multipart Form (custom order + brand logo) | 201 Created

6. Version Control & Shared Repository Strategy

To mimic modern agile engineering standards, teams must maintain a centralized Git repository (such as GitHub) using a strict branch-and-merge structure. Direct commits to primary branches are forbidden.

1. Primary Branches: The repository maintains two protected branches: 'main' (which must always be stable and deployable) and 'development' (for full integration updates).

2. Feature Branches: Each student develops inside a dedicated branch prefixed by their name (e.g., 'student1-auth', 'student3-catalog'). Feature branches are pulled from 'development'.

3. Code Review & Merging: To merge a feature branch back into 'development', the developer must submit a Pull Request (PR). Every PR requires a visual review, passing unit tests, and at least one peer approval code review.

4. Implementation Roadmap (8-Week Timeline)

Table 7.1: Weekly Milestone Roadmap

Phase | Weekly Period | Core Developmental Milestone
Phase 1 | Weeks 1 - 2: Architecture & Setup | Initialize repository, configure Tailwind, model the database schema, setup the routing shell, and outline localized key-value translations.
Phase 2 | Weeks 3 - 4: Core Development | Students code their respective components, write individual REST API routes, perform endpoint data validation tests, and sync client-side states.
Phase 3 | Weeks 5 - 6: Integration & API Bind | Connect React interfaces directly to Node/Express endpoints, audit database triggers, perform security code sweeps, and verify translation maps (ES/EN).
Phase 4 | Weeks 7 - 8: Audit, Polish & Launch | Compress assets, optimize API queries, lazy-load images, and deploy the application to cloud environments. Document running setups and deliver team presentations.

8. Evaluation Matrix & Grading Criteria

Table 8.1: Unified Grading Rubric Structure

Category | Weight | Strategic Evaluation Criteria
Application Functionality | 40% | The platform must load fast, transition smoothly, and process API requests correctly. Dynamic shopping state, multi-criteria filtering, localization toggles, and customized order form submissions must work without console errors.
Code Quality & Design | 25% | Every file must demonstrate a component-based model with clean structure, robust comment notes, and consistent semantic naming. Proper layout styling using responsive Tailwind utilities is mandatory.
Visual & UX Design | 20% | The system layout must follow a professional, high-end chocolate visual scheme. Elements must align nicely and support mobile layouts correctly (mobile-first designs).
Collaboration & Workflow | 10% | Students are evaluated on their active GitHub pull requests, git commit histories, constructive code review reviews, and weekly group integrations.
Deployment & Documentation | 5% | Deliver a detailed, clean Markdown README detailing dependencies, exact instructions to install, API maps, and clear database schemas. The app must launch successfully in a live cloud setting.

─ End of Requirements Document ─
