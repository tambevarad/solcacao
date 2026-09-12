from pathlib import Path
from xml.sax.saxutils import escape
import json
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Preformatted,KeepTogether,Table,TableStyle
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
R=Path(__file__).resolve().parents[2]
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
for name,filename in [('Body','DejaVuSans.ttf'),('Bold','DejaVuSans-Bold.ttf'),('Mono','DejaVuSansMono.ttf')]:
 pdfmetrics.registerFont(TTFont(name,str(R/'docs/tools/fonts'/filename)))
S=getSampleStyleSheet()
S.add(ParagraphStyle(name='TitleClean',fontName='Bold',fontSize=20,leading=25,spaceAfter=15))
S.add(ParagraphStyle(name='HeadingClean',fontName='Bold',fontSize=13,leading=17,spaceBefore=10,spaceAfter=6))
S.add(ParagraphStyle(name='BodyClean',fontName='Body',fontSize=10,leading=14,spaceAfter=7))
S.add(ParagraphStyle(name='SmallClean',fontName='Body',fontSize=8.5,leading=11.5,spaceAfter=5))
S.add(ParagraphStyle(name='CodeClean',fontName='Mono',fontSize=8.5,leading=11.5,spaceAfter=10))
def clean(s):return s.replace('–','-').replace('—','-').replace('’',"'").replace('“','"').replace('”','"').replace('→','->').replace('\u2011','-')
def p(s,style='BodyClean'):return Paragraph(escape(clean(s)),S[style])
def code(s):return Preformatted(clean(s),S['CodeClean'])
def page(title,items):
 out=[p(title,'TitleClean')]
 for item in items:
  if isinstance(item,tuple):
   typ,text=item;out.append(code(text) if typ=='code' else p(text,'HeadingClean' if typ=='h' else 'SmallClean' if typ=='small' else 'BodyClean'))
  else:out.append(p(item))
 return out

def footer(c,d):
 c.saveState();c.setFont('Body',8);c.setFillColor(colors.HexColor('#555555'));c.drawString(46,27,'SolCacao | Five-student implementation playbook');c.drawRightString(566,27,str(d.page));c.restoreState()
def build(path,pages):
 story=[]
 for i,x in enumerate(pages):
  if i:story.append(PageBreak())
  story+=x
 SimpleDocTemplate(str(path),pagesize=(612,792),leftMargin=46,rightMargin=46,topMargin=42,bottomMargin=46,title=path.stem.replace('-',' '),author='SolCacao project team').build(story,onFirstPage=footer,onLaterPages=footer)
roles={1:('Authentication, Security & Databases','auth'),2:('Core Layout, Navigation & Localization','shell'),3:('Gourmet Catalog, Search & Cart State','catalog'),4:('B2B Services & Customization Wizard','b2b'),5:('Personalization, Contacts & Notifications','support')}
phase_names={1:'Architecture & Setup | Weeks 1-2',2:'Core Development | Weeks 3-4',3:'Integration & API Bind | Weeks 5-6',4:'Audit, Polish & Launch | Weeks 7-8'}
scopes={
1:['Model Users/Partners/Addresses; coordinate ERD and security interfaces.','Build auth/profile/address UI plus bcrypt/JWT/routes/validation.','Bind real auth, verify cart transitions, roles, expiry and access controls.','Audit security/configuration and support live deployment and demo.'],
2:['Audit repository/Tailwind/routing; outline translations; assemble Phase1 kit.','Build shell/mobile navigation/shared UI and localization/static APIs.','Bind live dictionaries and coordinate real cross-feature integration.','Optimize/deploy the app, finish README and coordinate final presentation.'],
3:['Model Product/Inventory/Cart; define retail wireframes and fixture data.','Build catalog/filter/cart/checkout UI plus matching real REST services.','Verify real filter/cart/merge/order flows, races and authoritative prices.','Optimize queries/images, verify live retail flow and demonstrate it.'],
4:['Model custom requests; design homepage, services and four wizard screens.','Build homepage/wizard plus multipart quote persistence/private storage.','Bind real business auth, uploads, receipts and notification bridge.','Polish imagery/UX, verify durable files and demonstrate live requests.'],
5:['Model inquiries; design support/sampler screens and notification interfaces.','Build forms/sampler/static views plus inquiry validation and SMTP bridge.','Bind real forms/catalog sampler/quote notifications; verify failures.','Audit accessibility/content, verify live mail flow and present evidence.']}
prompts={}
for n in roles:
 prompts[str(n)]={}
 for phase in range(1,5):
  prompts[str(n)][str(phase)]=f'''Run npm run agent -- --member {n} --phase {phase}.
Read .agent/task.md and every reference it names.
Implement only Student {n} Phase {phase}; follow its ordered
steps, ownership and exact contracts. Run required checks,
record real evidence and update handoff/status. Stop before
commit, push, merge, deploy or starting the next phase.'''
(R/'docs/agent-prompts.json').write_text(json.dumps(prompts,indent=2)+'\n')
pages=[]
pages.append(page('SolCacao student playbook',[
'The setup routine and exact prompts for five students working with Gemini, Claude, Cursor, GPT or Copilot. Use this with the revised repository, not as a standalone replacement for its contracts.',
('h','What changed after the requirements audit'),
'Phase1 is restored. Phase2 contains frontend AND backend coding. Phase3 binds React to real APIs and audits security, database logic and translations. Phase4 optimizes, launches and presents. Every member has four detailed playbooks in the repository.',
('h','Two schedules, both preserved'),
'The SolCacao blueprint defines the eight-week execution roadmap. The screenshot defines academic checkpoint deliverables. Page4 explains the crosswalk. An earlier template delayed backend and integration work; that schedule is superseded by this revision.',
('h','One instruction per phase'),
'After setup, paste the prompt on your student page into your open coding agent. The agent runs one repository command, reads a generated task packet, and implements the requested scope. The command itself is not an AI launcher.',
('h','Human gates remain explicit'),
'Teammates still review their changes, commit, open PRs, obtain visual review/passing unit tests/one peer approval, and perform course demonstrations. No agent can truthfully invent reviewer approval, credentials, a cloud deployment or an external prototype.',
('h','Where to begin'),
'Coordinator: page2. Every student: page3. Roadmap/Phase1: page4. Student1-5 prompts: pages5-9. Review/resume: page10. Prototype and remaining gates: page11.',
('small','Sources: supplied SolCacao requirements DOCX and CSE5335 phase screenshot. Fran\'s observations are documented with source URLs in docs/design/frans-reference.md. The repository contains a detailed requirements audit.')]))
pages.append(page('Coordinator setup',[
'Perform once before students start implementation. The corrected work is on codex-requirements-audit; previous main/development are preserved until an actual review PR is merged.',
'1. Extract the repository, install Git/Node24.19.0 and sign into GitHub CLI if using the command line. Open the repository root in the editor. Do not share login tokens in chat.',
'2. Fill team/roster.json with exactly five real names/handles and dedicated branches such as varad-catalog. Initial student1-auth through student5-support are placeholders following the blueprint example.',
'3. Create the shared private repository, push audit/main/development, and set main as default. See docs/github-setup.md for the complete commands and existing-name handling.',
('code','gh repo create solcacao --private --source=. --remote=origin --push\ngit push origin main development\ngh repo edit --default-branch main'),
'4. Protect BOTH main and development: require PRs, passing CI verify, at least one peer approval, resolved conversations; dismiss stale approvals and block force pushes/deletion. Confirm the repository plan supports these protections. Local hooks alone are not sufficient.',
'5. Open audit -> development PR, using the actual tests and visual evidence. Another teammate reviews and approves; merge through the PR only. Publish stable development -> main through a reviewed release PR.',
'6. Confirm project defaults together: simulated checkout, six-piece sampler inquiry, wholesale quantity50 minimum and PDF uploads. These fill unspecified details and are not professor-stated values. Resolve changes through one contract PR before dependent work.',
'7. Establish weekly integration records and the real MarvelApp/MockFlow project. Assign prototype and presentation contributions to all five members.',
('small','No remote repository/protection or peer approval was performed in this session. This procedure is deliberately not bypassed with a direct primary-branch commit.')]))
pages.append(page('Every student setup',[
'Use a separate local clone and your assigned role. Open the repository root so the agent can read AGENTS.md, context.md and team/member-N.',
'1. Install Git and Node24.19.0 from the version recorded in .nvmrc. Install Docker Desktop for the supplied local MongoDB/mail sink, or agree on equivalent development services. For PDF regeneration only, install Python3 and docs/tools/requirements.txt.',
'2. Clone the shared repository after the corrected template is reviewed into development. Keep unrelated work out of the checkout. Configure your real Git author name/email locally if needed.',
'3. Run setup for your member number. It checks cleanliness, fetches/synchronizes development, switches/creates your dedicated branch, creates .env if absent, installs locked dependencies and enables the local primary-branch hook.',
('code','npm run setup -- --member 3'),
'4. For Phase2 onward, start local services and the application as the phase requires. Mailpit is a test inbox, not a real customer email service.',
('code','npm run services\nnpm run dev'),
'5. Give the exact member/phase prompt from pages5-9 to your open coding agent. It generates .agent/task.md. A wrong branch or unfinished previous phase produces an explicit blocker; do not ask the agent to bypass it.',
'6. If setup encounters divergent branches, preserve changes and ask the agent to merge development on the feature branch and resolve conflicts with owners. Never use a blind reset, force push, or replacement of a peer’s files.',
('h','Useful commands'),
('code','npm run check\nnpm run build\nnpm run check:ownership -- --member 3 --base development'),
('small','For agents without shell access, attach AGENTS.md, context.md, docs/roadmap.md, docs/contracts.md, docs/api.json, the design reference and your member/phase files. Ask it to follow the same scope; it cannot claim checks it cannot execute.')]))
pages.append(page('Roadmap and Phase1 gates',[
('h','Phase1 / Weeks1-2'),
'Initialize repository, configure Tailwind, model database schemas, set up routing shell and outline EN/ES key-value translations. Each student models their own subsystem; Student1 coordinates relationships and Student2 assembles the shared planning artifacts.',
'The course additionally requires an ERD, database schema design, exactly three pages of project overview, an interactive prototype using MarvelApp or MockFlow, and an MS Teams demo. The repository includes draft ERD/overview and original frames/hotspots. Final review and actual hosted prototype remain required.',
('h','Phase2 / Weeks3-4'),
'Code owned React components AND individual REST endpoints, perform endpoint validation tests and synchronize client state. The academic frontend demo must show a complete responsive React UI and client functionality; backend implementation is not postponed.',
('h','Phase3 / Weeks5-6'),
'Connect React directly to Express APIs, audit database-trigger needs/service logic, sweep security and verify ES/EN maps. The academic backend demo shows REST APIs, actual database integration and server business logic. No hidden fallback to mock success.',
('h','Phase4 / Weeks7-8'),
'Compress assets, optimize measured queries, lazy-load imagery, deploy to cloud, document clean setup and present the team’s work. Academic final: integrated application, comprehensive documentation and20-30minute face-to-face presentation/demo.',
('h','Weekly and per-PR requirements'),
'Every PR: visual review, passing unit tests and at least one peer approval. Every week: active member contributions and a recorded integration. Primary updates happen through PRs. Blueprint grading: functionality40%, code25%, UX20%, collaboration10%, deployment/docs5%. Screenshot phase percentages are a separate breakdown.']))
for n,(title,area) in roles.items():
 items=[f'Owned area: client/server features/{area}, your tests and team/member-{n}. Additional shared ownership is in docs/ownership.json. Start with npm run setup -- --member {n}.']
 for phase in range(1,5):
  items += [('h',f'Phase {phase} | {phase_names[phase]}'),('small',scopes[n][phase-1]),('code',prompts[str(n)][str(phase)])]
 pages.append(page(f'Student {n}\n{title}',items))
pages.append(page('Review commit and resume',[
('h','After your agent stops'),
'1. Read its changed-file list, working diff, tests and blockers. Confirm it changed only owned paths, preserved API signatures and did not implement a future phase. Ask for fixes in the same phase where needed.',
'2. Run npm run check and npm run build plus the phase-specific tests/manual scenarios. Perform actual visual review at375/768/1440px where relevant, EN/ES, keyboard and error states. A template build is not proof of a finished phase.',
'3. Commit reviewed owned paths using your own Git identity. Push your dedicated branch, open a PR to development and provide screenshots/demo evidence and actual command results. Avoid blanket git add when unrelated work exists.',
'4. Another teammate checks the diff, visual evidence and passing unit tests, then approves. Coordinator merges after requirements are met. Only then record integrated status and the real merge commit. Never fabricate a review to unblock the next phase.',
'5. Repeat setup to synchronize development before your next phase. Use the next prompt only after the earlier phase is integrated. Keep one dedicated name-prefixed branch per student.',
('h','Resume prompt for interrupted work'),
('code','Read my current phase packet, status, handoff and git diff.\nResume only the unfinished tasks for the same member/phase.\nPreserve completed and unrelated work, fix actual failures,\nrerun affected checks and update evidence honestly.\nStop before commit/push/merge or the next phase.'),
('h','When contracts conflict'),
'Prepare an exact proposed field/API/signature change in your own handoff. Student2 maintains shared API/type contracts with affected-owner review; Student1 coordinates schemas/ERD. Merge a single agreed contract change before dependent implementation. Do not independently rename fields or duplicate peer modules.']))
pages.append(page('Prototype and final checklist',[
('h','Required external prototype'),
'Create the project in MarvelApp or MockFlow. Import/recreate the16 original frames from docs/phase1/prototype/frames. The actual service’s supported import formats must be checked. Connect hotspots.json, refine fields/states and add mobile/Spanish counterparts. Verify all flows and save the real accessible share URL.',
'Walk through retail browsing/cart/guest checkout, login/cart merge, business four-step request, sampler and contact/feedback. Include back/edit/error states. Screenshots and local frame files alone do not satisfy the hosted interactive prototype requirement.',
('h','Phase1 review packet'),
'ERD and schema consistent across owners; reviewed three-page overview; functioning hosted prototype; MS Teams demo readiness; individual contributions/PRs/evidence. Draft artifacts are starting points, not completed team submission.',
('h','Final demonstration'),
'Allocate20-30minutes across all five students. Show real retail and business journeys, persisted records, protected uploads, notification outcomes, localization, mobile use and code/review evidence. Clearly identify simulated checkout as no payment collected. Demonstrate failures as well as success.',
('h','What remains external or unverified'),
'Actual team roster/handles, GitHub protections and human PR review; MarvelApp/MockFlow project; production imagery/business facts; SMTP/cloud credentials and live host. Browser smoke testing was blocked by missing Chromium/download failure in this environment. Do not report those steps passed.',
('h','Design materials ready to use'),
'Fran’s observation notes and URLs, proposed SolCacao tokens/page specs, original placeholder SVGs and deterministic fictional product fixtures are included. No Fran’s photography/logo/proprietary fonts are packaged as reusable assets.',
('small','Regeneration: python -m pip install -r docs/tools/requirements.txt, then python docs/tools/build_playbook.py. Generated PDF drafts must be rendered and visually checked after edits.')]))
build(R/'docs/student-playbook.pdf',pages)
overview=[
{'title':'SolCacao Project Overview','sections':[
('Purpose and users','SolCacao is a planned bilingual web application for a premium artisanal chocolate brand. It serves individual shoppers and business customers through distinct journeys in one coherent store. Retail customers browse single-origin bars, truffles and seasonal products. Business customers explore custom molds, personalized packaging and white-label services before requesting a manufacturing quote.'),
('Retail experience','The retail catalog supports search, origin and cacao-percentage filters, price filtering, pagination and sorting. Product views present localized information and imagery. A side-drawer cart supports quantity changes and removal. Guests can build a cart and use checkout; registered users can save carts and merge guest selections after login. Checkout is currently scoped as a clearly labeled simulation with a persisted order receipt and no payment or fulfillment; this default must be confirmed with the team/instructor.'),
('Business and personalization','The four-step business wizard covers cacao and quantity, a branding/design upload, packaging and contact details, then review and quote submission. Partner authorization and private file access protect requests. Contact, feedback, a customizable sampler inquiry, informational pages and WhatsApp redirection support customer communication. Notifications route validated inquiries through a server-side SMTP bridge.'),
('Language and visual approach','English and Spanish apply to navigation, product information, forms, errors and confirmation states. Language switching preserves useful in-progress state. The proposed presentation uses warm ivory, cacao tones, generous spacing, original product photography and clear packaging choices. Fran’s Chocolates is a design reference for restrained layouts and gift presentation; SolCacao retains its own identity and approved content.') ]},
{'title':'Architecture and Data Design','sections':[
('Technology','The application uses React18+ with Hooks and Context, Tailwind CSS and Lucide React. A separate Node.js/Express backend communicates through stateless REST JSON APIs, with multipart forms for uploads. MongoDB and Mongoose store application data. JWT bearer authentication and bcrypt password hashing support identity and role-based access. The repository adds TypeScript contracts and pinned dependencies to reduce integration mismatches among five developers.'),
('Data relationships','Users may own addresses and a saved cart; business users have a corporate-partner profile. Products have inventory records and localized fields. Cart items reference products, while simulated order items preserve price/name snapshots. B2B requests belong to authenticated business users and retain private file metadata. Inquiries may include sampler selections and notification state. The accompanying ERD and data dictionary define cardinalities, ownership rules, validation and indexes.'),
('Integration boundaries','Each student owns both the UI and server components of their subsystem. Shared DTOs and provider interfaces are fixed before feature coding. The product-list endpoint returns a JSON list with pagination headers; cart persistence accepts a JSON array, matching the blueprint. Internal adapters preserve convenient typed models without changing the wire contract. Mock services support frontend development, while real HTTP binding is completed in the third execution phase.'),
('Correctness and security','The server validates request fields, role/access ownership, product references, quantities and uploaded files. Prices are derived from stored product data. Cart revision checks and idempotency keys reduce accidental overwrites or duplicate submissions. Passwords/tokens are not stored in browser localStorage. Files remain private; saved requests are retained even when notification delivery fails. Test data is fictional and never represents verified business or food information.') ]},
{'title':'Team Delivery and Validation','sections':[
('Five responsibilities','Student1 owns authentication, security and identity/database coordination. Student2 owns the application shell, navigation, localization and public static assets. Student3 owns catalog, search, inventory, cart and the scoped retail checkout. Student4 owns homepage, B2B services, four-step customization and file-backed requests. Student5 owns contact/feedback/sampler/static views, inquiry validation and the SMTP notification bridge. All contribute tests, translations, reviews and presentations.'),
('Eight-week execution','Weeks1-2 establish repository, Tailwind, schemas, routing and translation outlines. Weeks3-4 implement each student’s React components and REST endpoints, validate data and synchronize state. Weeks5-6 connect the UI to real APIs, audit database logic, review security and verify both languages. Weeks7-8 compress assets, optimize queries, lazy-load images, deploy, document setup and rehearse presentations. The academic Phase1 also includes an ERD, schema, this three-page overview, a MarvelApp/MockFlow interactive prototype and an MS Teams demo.'),
('Version control and review','The shared repository has protected main and development branches. Students work on dedicated name-prefixed branches created from development. Direct primary-branch commits are forbidden. Every merge PR requires visual review, passing unit tests and at least one peer approval. Weekly integration records document progress and blockers. Stable releases reach main through reviewed PRs. The template’s audit revision remains unmerged until a real reviewer approves it.'),
('Acceptance and current status','Acceptance covers functional retail/business flows, responsive and accessible EN/ES interfaces, actual API/database persistence, private file behavior, truthful notifications, clean code, collaboration history, deployment and documentation. Final presentation lasts20-30minutes and includes all five members. This is a planning draft; hosted prototype, real team identifiers, production assets and external deployment access remain to be supplied/verified. The prototype kit and detailed per-student phase prompts support that work without claiming it is already complete.') ]}
]
(R/'docs/phase1/overview-source.json').write_text(json.dumps(overview,indent=2)+'\n')
build(R/'docs/phase1/project-overview.pdf',[page(o['title'],sum(([('h',h),txt] for h,txt in o['sections']),[])) for o in overview])
print('Created student playbook and three-page overview')
