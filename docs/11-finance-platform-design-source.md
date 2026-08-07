# المصدر الكامل — التصميم الشامل لنظام مالي مؤسسي سعودي لموقع AGMA

> نص مستخرج آلياً من PDF المالك (٣١ صفحة، أُدخل 2026-08-07).
> التقييم والقرارات في docs/11-finance-platform-design.md.
> ملاحظة: الاستخراج الآلي يقلب أحياناً ترتيب الكلمات العربية/اللاتينية المختلطة — عند الشك ارجع للـPDF الأصلي.
PAGES: 31


---
<!-- صفحة 1 -->

AGMAالتصميم الشامل لنظام مالي موؤسسي سعودي لموقع 
الملخص التنفيذي ونطاق الحل 
، وتقدم»موؤسسة عامر عبدالله بن عثمان الغامدي للخدمات التسويقية« نفسها كوكالة سعودية مقرها الرياض، تعمل تحت الاسم القانونيAGMAتُظهر
ثمانية مسارات خدمات رئيسية تشمل الذكاء الاصطناعي والأتمتة، التسويق الأدائي، السيو والمحتوى، السوشال ميديا، الهوية والتصميم، تطوير الويب 
كما تعتمد الشركة نطاقات عمل مخصصة بدل الباقات الجامدة، وتعرض نماذج تسعير. والمنتجات الرقمية، الاستراتيجية والاستشارات، والعلاقات العامة 
هذه الطبيعة تجعل النظام المالي المطلوب أقرب إلى . ومشاريع بعرض سعر مخصص، Workflowشهرية، ومبالغ لمرة واحدة، وتسعيراً لكل منصة
متكاملةProject AccountingوQuote-to-Cash . وليس برنامج محاسبة تقليدياً فقط
.المنشورة تبدأ بمكالمة استكشافية، ثم تحليل الفرصة، وتحديد النطاق، وبناء خارطة الطريق، والتنفيذ، فالقياس والتحسين المستمرAGMAمنهجية
وعرض سعر وعقد ومشروع وفاتورة ودفعة وتكلفة وموؤشر أداءOpportunityوLeadلذلك يُوصى بأن يعكس النظام هذه الرحلة حرفياً، مع ربط كل
. في سلسلة بيانات واحدة قابلة للتدقيق
الحل المقترح هو Saudi Corporate Finance Platform: متعدد الكيانات والعملات، مبني وفق القيود السعودية من البداية، ويشمل
طبقة الحلالنطاق
النمو والإيرادات عروض الأسعار، العقود، المشاريع، التجديدات، CRMالاستهداف، الحملات، العملاء المحتملون،
المالية التشغيليةالمدفوعات، التحصيل، الموردون، المصاريف، الرواتب، الخزينة، ZATCAالفوترة،
المحاسبةالإقفالات والتسويات، AR/APدفتر أستاذ مزدوج القيد، الإيراد الموؤجل، أصول والتزامات العقود، 
التخطيطسيناريوهات خمس سنوات، تخطيط السيولة والموارد، Forecastالميزانيات، 
الحوكمةالصلاحيات، فصل المهام، الموافقات، سجلات التدقيق، الإقفالات، سياسات المحاسبة
البيانات والتحليلاتالتدفق النقدي، CAC،LTV،ROAS،DSOربحية العملاء والمشاريع،، KPI
الامتثال والأمنعند قبول البطاقاتPCI DSSضوابط أمنية سعودية مرجعية،، ZATCA،PDPL
التصميم هوTarget Stateالمعلومات المنشورة تشير إلى استخدام محتمل لأدوات مثل. تدير حالياً نظاماً مالياً متكاملاًAGMA؛ لا يفترض أن
في إدارة العملاء، ما يعزز الحاجة إلى توحيد السجلات في مصدر موثوق واحد بدلاً WhatsAppوالبريد وGoogle SheetsوNotionوOdoo
 .من الاعتماد على جداول وأدوات متفرقة
:يجب فصل ثلاث حالات تنظيمية
الحالةالمعالجة المقترحة
كتاجر يقبل المدفوعاتAGMAمرخص، وعدم تخزين بيانات البطاقةPSPالتكامل مع بنك أو
كمطور تكاملات دفع لعملائهاAGMAخدمة تقنية فقط، مع التحقق من نطاق التصاريح والتعامل مع مزودين مرخص
كمقدم خدمة دفع أو محفظةAGMAقبل التشغيلSAMAيتطلب تحليلاً تنظيمياً وترخيصاً مستقلاً من
تميز بين خدمات الدفع المنظمة وبين خدمات الربط والدعم التقني، وتوؤكد أن البنوك تتعامل مع مقدمي خدمات دفع مرخصين؛ لذلكSAMAقواعد
AGMAالتصميم المقترح يفترض أنMerchant . تستخدم مزودي دفع مرخصين، لا أنها تحفظ أموال العملاء أو تدير حسابات دفع بنفسها
1
2
3
4
1


---
<!-- صفحة 2 -->

المبادئ المعمارية الحاكمة
لا عملية مالية بلا مستند مصدر.عقد، فاتورة، إشعار دائن، إيصال، أمر شراء أو كشف بنك : 
لا تعديل لقيد مرحّل.التصحيح بقيد عكسي أو مستند تصحيحي: 
المحرك المحاسبي مستقل عن واجهة المستخدم GL ثم SubledgerإلىAccounting Eventsكل وحدة تشغيلية ترسل: 
الامتثال ليس إضافة لاحقة.والإقفالات والصلاحيات جزء من نموذج البياناتPDPLوVATوZATCA :
كل عملية قابلة لإعادة التنفيذ بأمانidempotency keysتستخدمWebhooksوAPIs :
البيانات المالية ذات بعد زمني .نسخ العقود، أسعار الصرف، سياسات الإيراد، نسخ الميزانية ، Effective dates :
التقارير لا تعتمد على استعلامات يدوية مباشرة من قاعدة الإنتاج.مستودع بيانات وطبقة قياسات معتمدة: 
دورة العميل والإيرادات من الاستهداف إلى التجديد 
الاستهداف والاكتساب التسويقي 
يتوافق. والفرصة والعقد والإيراد المحصل، وليس فقط بالنقرات والتحويلات Leadيربط الإنفاق الإعلاني بالـMarketing Data Modelينبغي بناء
. خفض تكلفة الاستحواذ، وتحسين الحملات بالبيانات، ROASالمعلن على الأداء، دقة الاستهداف،AGMAذلك مع ترك
:سير العمل المقترح
المرحلةالبيانات الأساسيةالأتمتةالموؤشر
Audienceالقطاع، الحجم، المدينة، النضج الرقمي، الإنفاق
المتوقعوتجزئةScoringICP Fit Score
CampaignUTMالمنصة، المجموعة، الإعلان، التكلفة،استيراد يومي من المنصات CTR،CPC،CPL
Leadالمصدر، الخدمة، الميزانية، الموافقة التسويقية وإثراء DeduplicationMQL Rate
Opportunityالقيمة، الاحتمال، الخدمات، تاريخ الإغلاقNext BestوPipeline
ActionWin Rate
Proposalالنطاق، الموارد، المدة، السعر والهامشتوليد عرض من قالبProposal-to
Win
Contractالتجديد، SLAالالتزامات، الدفعات، توقيع إلكتروني وتنبيهاتContract Cycle
Clientجهات الاتصال، حدود الائتمان، KYC/KYBبوابة العميلActivation Time
Renewalالاستخدام، الربحية، رضا العميلتذكير قبل الانتهاءNRR،Churn
 .1
 .2
 .3
 .4
 .5
 .6
 .7
عقوم
AGMA
جذامنلاو
CRM
باستكاو
ءالمعلا
Google
/
Meta
/
LinkedIn
ضورعلا
ريعستلاو
دوقعلا
عيقوتلاو
عيراشملا
ميلستلاو
ةرتوفلا
تاكارتشالاو
كرحم
تابثإ
داريإلا
FATOORA
/
ZATCA
تاباوب
عفدلا
كونبلاو
ممذلا
ليصحتلاو
تايرتشملا
نودروملاو
ممذلا
ةنئادلا
بتاورلا
رتفد
ذاتسألا
Bank
Feeds
/
Open
Banking
ةنيزخلا
ةقباطملاو
لافقإلا
ديحوتلاو
ريراقتلا
تاحولو
تارشوؤملا
5
2


---
<!-- صفحة 3 -->

يجب اعتماد هوية موحدة للعميلparty_idالمطابقة تستخدم رقم. والفوترة والمشاريعCRM بحيث لا ينشأ سجل جديد لنفس الشركة في
.لمراجعة حالات الاشتباه Queueالسجل التجاري، الرقم الضريبي، النطاق الإلكتروني، البريد والهاتف، مع
KYC/KYBوOnboarding
المصطلح الأدق هو، B2Bبالنسبة لوكالةتجاري KYBالغرض هو التحقق من صحة الجهة، ممثليها، عنوان الفوترة، بيانات. مصرفياً كاملاًKYC، وليس
المصرفيةKYCالمنشورة أنها موؤسسة مالية منظمة؛ لذلك لا ينبغي نسخ إجراءات AGMAلا تُظهر خدمات. المخاطر الائتمانية، وصلاحية الموقّع، VAT
هذا استنتاج مبني على طبيعة خدمات. بلا داع، بينما يصبح التقييم التنظيمي الموسع مطلوباً إذا قدمت الشركة مستقبلاً خدمات دفع أو حفظ أموال 
SAMAوقواعد ترخيص خدمات الدفع لدىAGMA
:المقترحةonboardingمتطلبات
الحقل أو المستندإلزاميته التحقق
الاسم القانوني العربي والإنجليزيإلزامي مطابق للسجل التجاري
رقم السجل التجاري ونوع المنشأةB2Bإلزامي تحقق آلي أو مراجعة مستند 
VAT statusالرقم الضريبي وعند التسجيلصيغة الرقم ومطابقة الفاتورة
العنوان الوطنيإلزامي للفوترة حقول منفصلة، لا نص حر فقط
المالك أو المفوض بالتوقيعإلزامي تفويض أو صفة نظامية
البريد ورقم الجوالإلزامي أو تحقق بريدOTP
المستفيد الفعليحسب سياسة المخاطرللشركات ذات هياكل معقدة
قائمة الخدمات والغرضإلزامي ربط بخطة العقد
حدود الائتمان وشروط السدادإلزامي Credit policy
الموافقات التسويقيةمنفصلةقابل للسحبConsentسجل
مصدر الأموال أو فحص العقوباتRisk-basedللصفقات العالية أو غير المعتادة
:حالة العميل تمر عبر
DRAFT → SUBMITTED → UNDER_REVIEW → NEEDS_INFORMATION → APPROVED → ACTIVE → 
SUSPENDED → CLOSED
.ولا يمكن إصدار فاتورة نهائية قبل اكتمال الحد الأدنى من بيانات البائع والمشتري المطلوبة ضريبياً
العقود والتسعير
وأسعار مخصصة، مع عوامل مثل حجم العمل، عدد، Workflowالمنشور يجمع بين رسوم شهرية، أسعار لمرة واحدة، أسعار لكلAGMAتسع
لذلك يجب أن يكون محرك التسعير . القنوات، عمق الاستراتيجية، الإنتاج، مدة التعاون، الأتمتة والتكامل والتقارير Component-based وقادراً 
. على مزج أكثر من نموذج في العقد نفسه
نموذج السعرAGMAمثالمنطق الفوترةمنطق الإيراد 
Fixed one-timeأو هويةSEOتدقيقعند التسليم/مراحل /مقدمنقطة زمنية أو على مدى التنفيذ
6
7
3


---
<!-- صفحة 4 -->

نموذج السعرAGMAمثالمنطق الفوترةمنطق الإيراد 
Monthly retainerسيو أو إدارة سوشالشهري مقدماً أو موؤخراً على مدى الشهر
Per-unitWorkflowقطعة محتوى أوالسعر× الكميةعند التسليم والقبول
MilestoneAI Agentموقع أونسب حسب الإنجازحسب التزام الأداء 
Usage-basedAPI،Leadsساعات،استهلاك فعليعند حدوث الاستخدام
Media feeنسبة من الإنفاقنسبة أو مبلغ ثابتPrincipal/Agentوفق دور
HybridSetup + Supportفاتورة تأسيس ثم اشتراك فصل التزامات الأداء 
Success feeنتيجة أو تحويلعند تحقق الشرطVariable consideration
:يجب أن يحتوي العقد على
Effective datesمع، Revision numberنسخة و
.قابلة للقياسDeliverablesنطاق عمل و
.التشغيليةTasksمحاسبية منفصلة عنPerformance obligations
سعر البيع المستقلstandalone_selling_price.
.طريقة الفوترة، العملة، شروط السداد، الحد الائتماني، الدفعة المقدمة
Change Requestsمعالجة التغيير و
.ملكية الأصول والمحتوى والبرمجيات
.ومعايير القبولSLA
.سياسة إلغاء أو استرداد
.التجديد التلقائي أو اليدوي وفترة الإشعار
.والاقتطاع الضريبي إن وجدVAT
.لمصاريف الإعلانات والمنصاتPrincipal versus Agentتقييم
تحديد العقد، تحديد التزامات الأداء، تحديد سعر المعاملة، توزيعه على التزامات الأداء، ثم إثبات الإيراد : يعتمد نموذجاً من خمس خطواتIFRS 15معيار
كما أن عرض الإيراد إجمالياً أو صافياً يتوقف على ما إذا كانت المنشأة تسيطر على الخدمة قبل نقلها للعميل أم ترتب فقط . عند أو أثناء الوفاء بالالتزام 
. لتقديمها من طرف آخر
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
8
4


---
<!-- صفحة 5 -->

الفوترة والدفع والتحصيل
ويجب أن تُعتمد قبل تسليم المستند الصحيح للمشتري، بينماClearanceتتبعB2Bالفواتير الضريبية القياسية، ZATCAفي مرحلة التكامل مع
المطلوبة، لاXMLكما يجب إرسال المستندات بصيغة.  ساعة24خلالFATOORAويمكن إرسالها إلىReportingتتبعB2Cالفواتير المبسطة
PDFالاكتفاء بملف
:قنوات الدفع المقترحة
القناةالاستخداممتطلبات التصميم
madaدفعات بطاقات محليةPSPمنtokenأوHosted checkout
Apple Payدفع سريع عبر الأجهزةمن المزودMerchant validation
بطاقات ائتماندولي/محليوسياسة نزاعات 3DS
SADADفواتير وقنوات مصرفيةBiller reference/رقم فاتورة
تحويل بنكيكبيرةB2Bعقودأو مرجع فريدVirtual IBAN
التحويل الفوريSARIEتحصيل سريعمطابقة مرجع التحويل
Payment Linkعروض ومقدماتصلاحية، حد مبلغ، استخدام مرة واحدة
Auto-debitاشتراكات عند توفره وإدارة فشل السحبMandate
.سجلات الدفع يجب أن تحتفظ بالمبلغ، العملة، التاريخ، القناة، المرجع، الحالة، الرسوم، آخر أربعة أرقام فقط عند الحاجة، وبيانات الاسترداد أو العكس
أوApple Payلسجلات وإشعارات المعاملات تتضمن عناصر مثل المبلغ، العملة، اسم المتجر، نوع البطاقة، وسيلة التنفيذ مثل SAMAتعليمات
. تاجراً لا موؤسسة مالية AGMAآخر أربعة أرقام، التاريخ والوقت؛ وهي مرجع مناسب لتصميم سجل الدفع حتى عندما تكون، Mada Pay
PCIمعيارPCIلتقليل نطاقPSPمنtokenizedيجب استخدام صفحة دفع مستضافة أو حقول. في النظامCVVالكامل أوPANيُحظر تخزين
. يمثل خط الأساس لحماية بيانات حسابات الدفع، وتطبق متطلباته على الجهات التي تخزن أو تعالج أو تنقل بيانات البطاقاتDSS v4.0.1
ليمعلا
ذاتسألارتفد 
ممذلا
PSP/كنبلا
ZATCA
ةرتوفلا
دوقعلا
CRM
ليمعلا
ذاتسألارتفد 
ممذلا
PSP/كنبلا
ZATCA
ةرتوفلا
دوقعلا
CRM
alt
[Accepted]
[Rejected]
ليمعلاتانايبوضرعلادامتعا 
ءاشنإ Billing Schedule
وتاموصخلاودونبلاباستحا VAT
Clearance ةروتافل B2B
Accepted / Warning / Rejected
لاسرإ XML/PDF عفدلاطبارو 
عفد Mada/Apple Pay/SADAD/ليوحت
Webhook عّقوم
ريتاوفللةعفدلاصيصخت 
كنبلاديق /موسرلاوممذلا 
ديصرلاثيدحتولاصيإ 
حيحصتةمهمءاشنإولاسرإلاقيلعت 
9
10
11
5


---
<!-- صفحة 6 -->

المعمارية الوظيفية والبيانية
مقارنة الوحدات الوظيفية
الوحدةالوظائف الأساسيةالقيود المحاسبيةالتكاملات
Marketing
AttributionLeadsتكلفة،، UTMحملات،لا قيود مباشرة؛ تكاليف حملات،Meta،Google
LinkedIn
CRM،Leadsجهات،
Opportunitiesتوقعات فقطWhatsAppالموقع، البريد،
Customer Masterائتمان، VATعناوين،، KYBيمنع التكرار CRMالسجل التجاري،
CPQتكوين نطاق وسعر وخصمتقدير هامشCRM،Resource
planning
Contractsتجديد، SLAنسخ، التزامات، Contract assets
liabilitiesE-signature
Project AccountingWIPمهام، وقت، تكلفة،تكلفة مشروع وإيراد PM،Timesheets
BillingUsageجداول، اشتراكات، AR،VAT،deferred
revenueZATCA،PSP
Collectionsوعود دفع، نزاعات ، DunningBad debtوECLبنك، SMSبريد،
Procurementاستلام، POطلب شراء، CommitmentsVendor portal
APway match-3فواتير موردين،AP/Input VATبنك، OCR
TreasuryCash forecast،FXبنوك،Bank GL،FX gain/lossOpen Banking
RevenueIFRS 15 schedulesRevenue/contract
balancesContracts/Projects
GLقيود، فترات، تسويات Double entryجميع الوحدات
TaxVAT،WHT،Zakat packsTax control accountsZATCA
BudgetingDriver-based plansBudget versionsHR،CRM،GL
Consolidation،Intercompany
eliminationsGroup reportingEntity ledgers
BIوتقاريرKPIsRead-only semantic
layerDWH
التصميم المنطقي للبيانات 
داخلية مع أرقام بشرية مستقلة مثل UUIDsيجب استخدامINV-2026-000123كل جدول أساسي يحتوي على. entity_id ,
created_at ,created_by ,updated_at ,row_version، بينما المستندات المالية المرحّلة لا تُحذف ولا يُكتب
.فوقها
6


---
<!-- صفحة 7 -->

قاموس البيانات الأساسي 
الكيانالحقول الجوهريةقواعد الجودة
party،legal_name_ar/en،party_type،CR
tax_idفريد ضمن الدولةCR/Tax ID
customer_account،credit_limit،payment_terms
risk_ratingالعملة الافتراضية مسموحة للكيان 
contract،version،start/end،status
currencyبلا موافقاتActivation لا
contract_line،service_code،qty،unit_price
tax_codetotal = qty × price − discount
performance_obligation،method،SSP،allocation
acceptance
يساويallocationمجموع
transaction price
invoicetype،UUID،ICV،VAT total،ZATCA
statusclearanceلا تعديل بعد
payment،provider_ref،channel،amount
statusفريدprovider_ref
payment_allocationpayment_id،invoice_id،amountلا يتجاوز المتاح أو الرصيد
journal_entry،source،posting_date،period
statusdebit = credit
journal_lineaccount،debit/credit،dimensionsجهة ومركز تكلفة حسب قواعد الحساب
bank_transactionbank_ref،booking_date،amountمنع التكرار بالمرجع والبصمة 
audit_event،actor،action،before_hash
after_hashAppend-only
consent،purpose،status،collected_at
withdrawn_atموافقة منفصلة لكل غرض
owns defines holds may_be may_be has
owns
produces
contains accepted_as
contains defines deliversschedules
generates
containssettled_byallocates submitted_as
recognized_by consumes incurs
receives
matched_to
paid_by
containsposted_toclassified_byattributed_to
matchedmatched
initiated_by
assigned
LEGAL_ENTITY
BRANCH FISCAL_PERIOD BANK_ACCOUNT
PARTY
CUSTOMER_ACCOUNT VENDOR_ACCOUNT PARTY_CONTACT
OPPORTUNITY
QUOTE
QUOTE_LINE CONTRACT
CONTRACT_LINE PERFORMANCE_OBLIGATION PROJECTBILLING_SCHEDULE
INVOICE
INVOICE_LINEPAYMENT_ALLOCATION
PAYMENT
ZATCA_SUBMISSION
REVENUE_SCHEDULE TIME_ENTRY EXPENSE
PURCHASE_ORDER
VENDOR_BILL
PAYMENT_RUN_ITEM
JOURNAL_ENTRY
JOURNAL_LINE
GL_ACCOUNTCOST_CENTER
BANK_TRANSACTION
RECONCILIATION_MATCH
AUDIT_EVENT
USER
ROLE
7


---
<!-- صفحة 8 -->

الكيانالحقول الجوهريةقواعد الجودة
data_retention_rulecategory،period،legal_basislegal holdلا حذف عند
البنية التقنية المرجعية
يوصى ببنية Modular Monolithمبكرة تزيدMicroservicesداخلي، بدلاً من Event Bus في الإصدار الأول، مع فصل واضح للنطاقات و
.لاحقاً عندما يظهر احتياج فعلي للتوسعReportingوZATCA AdapterوPayment Adapterيمكن استخراج . التعقيد
المكوّنالخيار المرجعي
FrontendNext.js/React،RTL-first،TypeScript
Backendوفق خبرة الفريقNestJSأوJava/KotlinأوNET.
OLTPRow-Level SecurityمعPostgreSQL
Cache/locksRedis
Messagingmanaged queueأوRabbitMQ
Documentsversionedمشفر وObject storage
Searchعند الحاجةOpenSearchأولاً؛ PostgreSQL FTS
IdentityOIDC/SAML،MFA،SCIM
ReportingData warehouse + semantic model
ObservabilityOpenTelemetry،centralized logs،SIEM
InfrastructureIaC،containers،managed database
Secretsلا أسرار في الكود ، KMS/Secrets Manager
:مثالZATCAتفاصيل مزود الدفع أو البنك أوCore Financeبحيث لا يعرف، Adaptersيجب أن تكون التكاملات ع
PaymentProvider
 ├─ createCheckoutSession()
 ├─ verifyWebhook()
 ├─ capturePayment()
 ├─ refundPayment()
 ├─ queryTransaction()
 └─ downloadSettlementReport()
EInvoiceProvider
 ├─ onboardDevice()
 ├─ validateInvoice()
 ├─ clearStandardInvoice()
 ├─ reportSimplifiedInvoice()
 ├─ renewCertificate()
 └─ getSubmissionStatus()
8


---
<!-- صفحة 9 -->

نموذج الأحداث المحاسبية
:ترسل أحداثاً مثل. يدوياًGLلا تُنشئ الوحدات قيود
{
"event_id": "0b26c5b2-...",
"event_type": "invoice.cleared",
"entity_id": "sa-main",
"occurred_at": "2026-08-07T10:15:00+03:00",
"document_id": "INV-2026-000123",
"currency": "SAR",
"amounts": {
"net": "10000.00",
"vat": "1500.00",
"gross": "11500.00"
},
"dimensions": {
"customer_id": "CUS-1204",
"project_id": "PRJ-2401",
"service_line": "AI_AUTOMATION",
"cost_center": "DELIVERY"
},
"idempotency_key": "invoice.cleared:INV-2026-000123:v1"
}
:القاعدة المناسبةAccounting Rules Engineثم يطبّق
الحدثمديندائن
فاتورة لخدمة منجزةذمم عملاءVAT Output + إيراد 
فاتورة مقدماًذمم عملاءContract Liability + VAT Output
إثبات إيراد لاحق Contract Liabilityإيراد 
تحصيل عميلPSP Clearing/بنكذمم عملاء
رسوم بوابةمصروف رسوم دفعPSP Clearing
فاتورة موردInput VAT + أصل/مصروفذمم موردين
دفع موردذمم موردينبنك
مخصص خسائر ائتمانيةECLمصروفECLمخصص
إعادة تقييم عملةFX lossبنك أو/ذممبنك/أو ذممFX gain
9


---
<!-- صفحة 10 -->

المحاسبة والضرائب والتقارير الموؤسسية 
دفتر الأستاذ وشجرة الحسابات
قانون الشركات السعودي. للذمم والفواتير والمشاريع والأصول والبنوك، وفترات مالية قابلة للإقفال Double-entry،Subledgersالنظام يعتمد
يلزم الشركات بالاحتفاظ بسجلات محاسبية ومستندات موؤيدة وإعداد القوائم وفق المعايير المعتمدة في المملكة، كما تُرفع القوائم عادة خلال ستة أشهر
بحسب أهليةIFRS for SMEsمع إمكانية تطبيق، SOCPAالمعتمدة منIFRSالمعايير المعتمدة في السعودية تستند إلى. من نهاية السنة المالية
. المنشأة واختيارها المحاسبي
:شجرة الحسابات المقترحة
الرمزالمجموعةأمثلة
100000الأصول المتداولةذمم، دفعات مقدمة، PSP Clearingنقد، بنوك،
120000أصول العقودإيراد مستحق غير مفوتر 
130000مصروفات مدفوعة مقدماًتراخيص، تأمين، اشتراكات 
150000أصول ثابتة وغير ملموسةأجهزة، برمجيات، تطوير مرسمل
200000التزامات متداولة VAT،WHTموردون، رواتب،
220000التزامات العقود إيراد موؤجل ودفعات عملاء 
300000حقوق الملكيةرأس المال، حساب المالك، أرباح مبقاة 
400000الإيرادات AGMAحسب خطوط خدمات
500000تكلفة الإيراد مستقلون، إنتاج، استضافة مخصصة
600000المصروفات التشغيليةمبيعات، تسويق، إدارة، تقنية
700000مصروفات أخرى/إيرادات تمويل، مكاسب وخسائر، FX
800000ضرائب وزكاة مصروفات ومخصصات
900000حسابات إحصائيةBudgetsوCommitments
:الأبعاد الإلزامية 
Legal Entity / Branch / Department / Cost Center / Service Line / Client / 
Project / Channel / Intercompany / Contract
.لا ينبغي تكبير شجرة الحسابات بإضافة حساب منفصل لكل عميل أو مشروع؛ تستخدم الأبعاد لذلك
الإيراد والعقود 
AGMAعلى خدماتIFRS 15تطبيق
الخدمةالتزام الأداء المحتمل أسلوب الاعتراف الافتراضي 
تسويق شهريRetainerخدمات شهريةStand-readyيومي أو شهري على مدى الزمن
12
10


---
<!-- صفحة 11 -->

الخدمةالتزام الأداء المحتمل أسلوب الاعتراف الافتراضي 
إدارة الحملاتإدارة وتحسين مستمرعلى مدى الزمن
إنتاج محتوىكل دفعة محتوى أو حزمةعند القبول أو حسب التقدم
تصميم هويةأصول + دليل + مفهومإذا كانت متميزةMilestones
موقع إلكترونيتصميم، تطوير، نشر، دعمover-timeحسب تحليل السيطرة ومعاي
AI AgentDiscovery،Build،Deployment،Supportعن الدعم إذا كانا متميزينSetupفصل
Workflow automationمكتملWorkflowعند التسليم والقبول
استشارة استراتيجية Workshop + Roadmapعند التسليم أو على مدى الجلسات
Media spendشراء مساحة إعلانية Principal-AgentحسبGross/Net
:ينبغي أن يدعم المحرك
.ثابت ومتغيرTransaction price
.خصومات مرتبطة بعقد كامل أو التزام محدد 
.النسبيSSPتخصيص السعر حسب
Contract modifications
.Contract asset،receivable،contract liability
.milestones،units deliveredساعات،، Progress measures: time elapsed
.وموافقات المحاسبTrue-ups
.Remaining Performance ObligationsوRevenue waterfall
.لكل نوع تكلفة إعلانيةPrincipal/Agent memo
الذمم المدينة والتحصيل
ينبغي تطبيق. إيقاف الخدمة، وإعادة جدولة الديون، Collection queuesحدود الائتمان، وعود الدفع، نزاعات الفواتير، ، AgingتشملAR
حسب القطاع، عمر الدين، تاريخ العميل، ونظرة الإدارةProvision Matrixنموذج مبسط لخسائر الائتمان المتوقعة للذمم وأصول العقود، باستخدام
. يتضمن نهجاً مبسطاً يسمح بقياس خسائر العمر الكامل للذمم التجارية وأصول العقودIFRS 9المستقبلية؛
:المقترحةDunningقواعد
التوقيتالإجراء 
 أيام7قبل الاستحقاق بـتذكير لطيف ورابط دفع 
يوم الاستحقاقإشعار تلقائي
 أيام7+مهمة لموظف التحصيل
 يوماً15+إخطار مدير الحساب
 يوماً30+تعليق طلبات جديدة
 يوماً45+Legal reviewاعتماد خطة دفع أو
 يوماً90+ECL/Write-off recommendationتقييم
.يتطلب موافقتين وقيداً منفصلاً، ولا يحذف الفاتورة أو تاريخ التحصيلWrite-offأي
• 
• 
• 
• 
• 
• 
• 
• 
• 
13
11


---
<!-- صفحة 12 -->

المشتريات والذمم الدائنة
Procure-to-Payدورة
Purchase Request → Budget Check → Approval → PO → Receipt/Service Entry → 
Vendor Bill → Match → Payment Run → Bank Confirmation
:يُستخدم
.مقابل فاتورةPO :للخدمات الصغيرةTwo-way match
.مقابل استلام مقابل فاتورةPO :للمشتريات الماديةThree-way match
.للمستقلين والإنتاجService acceptance
.Four-eyes approvalدون تحقق مستقل وIBANمنع المورد من تغي
.وبصمة الملفIBANحسب المورد، الرقم، التاريخ، المبلغ،Duplicate invoice detection
.عند الدفع لجهة غير مقيمةWHT determination
.على كل بندVAT recoverability code
.وتوقيع مزدوجAPIمع ملف بنكي أوBatch payment
النقد والخزينة
قيود سيولة، تحويلات بين الحسابات، وتسويات، Daily Cash Position،13-week cash forecast،Cash runwayالتصميم يشمل
السعوديOpen Bankingمرخص لجلب معلومات الحسابات بموافقة العميل؛ إطارAggregatorأوOpen Bankingيمكن استخدامPSP
 .وبيئة اختبار واختبارات مطابقة APIsيتضمن
IAS 7كشف التدفق النقدي يصنف التدفقات إلى تشغيلية واستثمارية وتمويلية وفق
:المطابقة البنكية تستخدم
.تطابق تام بالمرجع والمبلغ
.تطابق مبلغ وتاريخ ضمن نافذة
PSPلتجميع دفعاتMany-to-one
.لتوزيع حوالة على فواتOne-to-many
.للحالات ضعيفة الثقةAuto-postدونML-likeاقتراح 
.للاستثناءات والرسوم والمرتجعاتQueue
تعدد الكيانات والعملات
. رغم أن بيانات الموقع تشير حالياً إلى كيان قانوني سعودي محدد، ينبغي بناء النظام ليستوعب شركات أو فروعاً مستقبلية في الخليج
:لكل كيان
.عملة وظيفية
.للشجرة الموحدةMappingشجرة حسابات أو
Tax registrations
.تقويم وفترات مالية 
.سياسات اعتماد وحدود صلاحيات
.حسابات بنكية وكيانات فوترة
.مستقلةEGSتسلسل أرقام فواتير وأجهزة
يفرق بين العملة الوظيفية، وهي عملة البيئة الاقتصادية الأساسية للمنشأة، وعملة العرض، وينظم تسجيل المعاملات الأجنبية وترجمة عملياتIAS 21
 .خارجية
• 
• 
• 
• 
• 
• 
• 
• 
14
15
 .1
 .2
 .3
 .4
 .5
 .6
3
 •
 •
 •
 •
 •
 •
 •
16
12


---
<!-- صفحة 13 -->

:تدفق العملة
.في تاريخ المعاملةSpotسعر
.سعر إقفال للأرصدة النقدية
.اختياري لبعض تقارير الإدارةAverage rate
.عند التسويةRealized FX
.عند الإقفالUnrealized FX
.عند توحيد كيان أجنTranslation reserve
.تثبيت مصدر السعر وتاريخ الاستيراد والموافق عليه 
.مطابقة الفروقات، وإقصاء الإيراد والمصروف والذمم عند التوحيد ، Due-to/Due-fromيدعم العقود والفواتير المتقابلة،Intercompany
والالتزامات الضريبية ZATCAوVAT
 مليون ريال تقدم إقرارات 40الشركات التي تتجاوز توريداتها السنوية. على التوريدات الخاضعة حيث ينطبق15القياسي في المملكة هوVATمعدل
.شهرية، بينما تقدم المنشآت التي لا تتجاوز ذلك عادة إقرارات ربع سنوية، مع وجوب تصميم التقويم الضريبي كإعداد قابل للتغيير لا كقيمة ثابتة في الكود 
XMLمواصفةAPIإصدار مستندات إلكترونية بالتنسيق والحقول المحددة، واستخدام، FATOORAتتطلب التكامل معZATCA Phase Two
 .VATللعملات والدول وفئاتISOمع قوا، EN 16931وقواعد متوافقة معUBLمبنية على
E-Invoicingمتطلبات وحدة
الوظيفةالتفصيل
Invoice typesStandard،Simplified،Credit Note،Debit Note
IdentifiersUUID،ICV،previous invoice hash
Tax fieldsVAT category،rate،taxable amount،exemption reason
Buyer IDsحسب الحالةVAT/TIN/CR
SecurityHash،signing/stamp،certificate lifecycle
QRZATCAتوليد حسب نوع المستند وقواعد
APIReportingوClearance
StatusDraft،Pending،Cleared،Reported،Warning،Rejected
Retryduplicate postingومنعbackoffمعQueue
Archiveresponse،PDF/A،hash،certificate metadataالأصلي،XML
Monitoringexpiry،rejection rate،backlog،24-hour breach risk
أن فترة الاحتفاظ الأساسية لا تقل عن ستZATCA، وتوضح إرشادات66يجب الاحتفاظ بها وفق المادةVATالفواتير والمستندات والدفاتر المرتبطة بـ
لذلك يقترح النظام سبع سنوات كسياسة تشغيلية افتراضية للسجلات المحاسبية والضريبية العادية، مع السماح بمدد . سنوات، مع مدد أطول لبعض الفئات
. على أن يوؤكد المستشار الضريبي المدة النهائية لكل فئة، Legal Holdأطول و
:التقويم الضريبي يتضمن كذلك
• 
• 
• 
• 
• 
• 
• 
17
18
19
13


---
<!-- صفحة 14 -->

الالتزام وظيفة النظام
VATReturn workpaper،box mapping،reconciliation
WHTتحديد المورد غير المقيم، النسبة، تاريخ الدفع، الإقرار 
Zakat/Income TaxTax pack،reconciliation،adjustments
Transfer PricingIntercompany register،related-party disclosure
Financial statementsQawaem-ready package
Tax certificatesأرشفة وربط بالشركة والعقد
 يوماً بعد نهاية السنة في120بينما تتكرر مهلة، ZATCAالشهرية تكون خلال الأيام العشرة الأولى من الشهر التالي وفق إرشاداتWHTإقرارات 
قابل للإدارة لأن التطبيق يعتمد على طبيعة الملكيةTax Calendarيجب إبقاء هذه المواعيد في. التزامات الزكاة أو ضريبة الدخل وفق الحالة 
. والكيان والمعاملة
التقارير والإقفالات
التكرار التقريرالمحتوى
يوميCash positionمدفوعات معلقة، PSPأرصدة بنوك،
يوميSales flashعروض، عقود، فواتير، تحصيل
أسبوعيPipeline forecastWeighted pipeline،bookings
أسبوعيweek cash-13تدفقات متوقعة وسيناريوهات
شهريP&Lحسب خدمة وعميل، Actual/Budget/Forecast
شهريBalance Sheetأرصدة ومقارنات وتحليلات
شهريCash Flowمباشر للإدارة وغير مباشر للقوا
شهريAR/AP Agingأعمار، تركّز، نزاعات 
شهريProject profitabilityإيراد، تكلفة، ساعات، هامش 
شهريRevenue waterfallRPOموؤجل، مثبت،
شهريMarketing unit economicsCAC،LTV،Payback،ROAS
ربع سنويBoard packForecastأداء، مخاطر، سيولة،
ربع سنويVAT packReturn،reconciliations،exceptions
سنويStatutory FSالقوائم والإيضاحات وسجل التدقيق
سنويZakat/Tax packوربط الإقرار Trial balance
خمس سنواتStrategic planP&L،BS،Cash،headcount،scenarios
:إقفال الشهر المقترح
20
14


---
<!-- صفحة 15 -->

يوم العملالنشاط
0Cut-offإيقاف المعاملات المتأخرة وتثبيت
1وتسوية الإيرادات PSPاستيراد البنوك و 
2والرواتب والمصاريفAP accruals
3Deferred revenueوRevenue recognition
4الأصول والإهلاك، FX،ECL
5وتوحيدIntercompany
6والتبايناتP&L/BSمراجعة 
7وقفل الفترةControllerاعتماد
الضوابط والصلاحيات والأمن والاستمرارية 
الأدوار وفصل المهام
الدورالنطاقممنوعات أساسية
Sales Representativeوفرص وعروضLeadsلا اعتماد خصم أو فاتورة
Account Managerعقود ومشاريع وتواصللا تعديل قيود
Project Managerالموارد والقبول والتقدملا اعتماد دفع مورد لنفسه
Billing SpecialistSchedulesوDraft invoicesلا تغيير بيانات بنك العميل
Collections Officerتحصيل ووعود دفعWrite-off لا
AP Accountantفواتير الموردينلا إنشاء وتفعيل المورد منفرداً
Treasury Officerدفعات ومطابقةمنفرداًPayment runلا اعتماد
GL Accountantقيود وتسوياتControllerلا فتح فترة ب
Revenue AccountantSchedulesوObligationsلا تعديل عقد تجاري
Tax SpecialistVAT/ZATCA/WHTلا حذف مستندات
Financial Controllerاعتماد وإقفاللا إدارة مستخدمين تقنيين
CFOالسياسات والحدود والتقاريرلا تنفيذ دفع منفرداً
Internal AuditorشاملRead-onlyلا إنشاء أو تعديل
System Adminإعداد تقني ومستخدمونلا روؤية بيانات مالية حساسة افتراضياً 
Security AdminLogsمفاتيح،، IAMلا صلاحية محاسبية
Client Portal Userمستندات جهتهلا وصول لجهات أخرى
15


---
<!-- صفحة 16 -->

:Segregation of Dutiesقواعد
.منشئ المورد لا يعتمد تفعيله
.لا يعتمد تغييرهIBANمُدخل
.منشئ الدفعة لا يوافق عليها
.منشئ القيد اليدوي لا يرحّله إذا تجاوز الحد
revenue policyأوVATلا يغSales
.CFOلا يمنح نفسه دورSystem Admin
.Audit logsلا يمكن لأي مستخدم إلغاء
.فورياًAlertمحدود زمنياً ويولدBreak-glass access
يوفر إطاراً قائماً على المبادئ لتصميم الرقابة الداخلية حول العمليات والتقارير والامتثال، ويصلح كأساس لمصفوفة المخاطر والضوابط COSO
 .المقترحة
محرك الموافقات
:الموافقة يجب أن تعتمد على القيمة والمخاطرة لا على نوع المستند فقط
:قابلة للإعدادThresholdsأمثلة
العمليةالمستوى الأولالمستوى الثانيالمستوى الثالث
خصم عرض5ح15%–5%15أكثر من
شراء SAR 5,000ح50,000–5,00150,000أكثر من
Refund1,000ح10,000–1,00110,000أكثر من
• 
• 
• 
• 
• 
• 
• 
• 
21
ال
 معن
معن
ال
معن
ال
ءاشنإ
بلط
وأ
دنتسم
حيحص
لمتكمو؟
عاجرإ
حيحصتلل
نمض
ةينازيم
دحو
مدختسملا؟
دامتعا
ريدم
ةدحولا
دامتعا
Finance
زواجتي
دحلا
يلاعلا
وأ
ءانثتسا؟
دامتعا
CFO/CEO
زهاج
ذيفنتلل
ذيفنت/ليحرت
Audit
Event
+
Notification
16


---
<!-- صفحة 17 -->

العمليةالمستوى الأولالمستوى الثانيالمستوى الثالث
قيد يدوي10,000ح100,000–10,001100,000أكثر من
Write-off2,000ح20,000–2,00120,000أكثر من
.الأرقام أعلاه تصميم أولي وليست حدوداً نظامية، وتُعتمد نهائياً من الإدارة
سجل التدقيق
:كل حدث حساس يسجل
.إن وجدImpersonationالمستخدم والهوية الفعلية و
.والتوقيت المحليUTCالزمن بتوقيت
session،correlation IDالجهاز،، IP
.العملية والكيان والسجل
Before/after hash
.ApprovalأوTicketسبب التعديل و
Webhook sourceوAPI client
.نتيجة العملية
.مستوى الحساسية
.دوريhash chainتوقيع أو
توصي بتسجيل نجاح وفشلOWASPإرشاداتSIEMفي مخزن منفصل، وإرسال الأحداث عالية الخطورة إلىAppend-onlyيوصى بسجل
. المصادقة، إخفاقات الصلاحيات، تغييرات الإعدادات، وأحداث النظام والأخطاء، كما توؤكد ضرورة إجراء فحوص الصلاحية على كل طلب 
PDPLحماية البيانات و
المنشورة تشير إلى جمع أسماء وأسماء شركات وأرقام جوال وبريد وخدمة وميزانية وبيانات استخدام وحملات، وإلى استخدام أدوات AGMAسياسة
لذلك يجب توثيق سجل أنشطة المعالجة، الموردين، أغراض المعالجة، النقل . وتحليلات وأطراف خارجية وإمكانية معالجة بيانات خارج المملكة CRM
 .عبر الحدود، وفترات الاحتفاظ فعلياً داخل النظام 
.كمصدر تصميم إضافي فقطGDPRيمكن استخدامGDPRولائحته،PDPLالمرجعية الملزمة هي النظام السعودي لحماية البيانات الشخصية
:المبادئ العملية
المبدأتطبيق النظام
تحديد الغرضلكل حقل ومعالجةpurpose code
تقليل البياناتعدم طلب هوية شخصية بلا حاجة
الشفافيةووقت القبولprivacy noticeنسخة
الموافقةمنفصل للتسويق والتحليلاتConsent
حقوق الأفراد بوابة طلب وصول وتصحيح وحذف
الاحتفاظبحسب الفئة والغرضRules
النقل الخارجيسجل مزود وموقع ومعيار حماية
الأمنMFA،least privilegeتشفير،
المساءلةROPA،DPIA،Audit trail
 •
 •
 •
 •
 •
 •
 •
 •
 •
 •
22
3
17


---
<!-- صفحة 18 -->

كما يجب. يتطلب عدم الاحتفاظ بالبيانات بعد انتهاء الغرض إلا لأساس نظامي، وتحدد الإرشادات ضرورة تقليل البيانات وفترات الاحتفاظ PDPLقانون
. الاحتفاظ بسجلات أنشطة المعالجة لخمس سنوات بعد توقف النشاط المعني
عند نقل البيانات خارج المملكة، يجب تسجيل الغرض والأساس القانوني والدولة والمستلم والضمانات، وقد يلزم تقييم مخاطر، خاصة للنقل المستمر أو
. واسع النطاق أو للبيانات الحساسة
 ساعة من العلم بالحادث،72عند خرق يحتمل أن يضر بالبيانات أو أصحابها، تنص اللائحة التنفيذية على إخطار الجهة المختصة خلال مدة لا تتجاوز
. مع إخطار الأفراد عند انطباق الشروط 
الأمن التطبيقي 
:الحد الأدنى المقترح
IBANللمدفوعات وتغيStep-up authenticationإلزامي للموظفين، و MFA
.SAMLأوOIDCعSSO
.للكيان والمبلغ والفرعABACمعRBAC
.للتكاملات عالية الحساسيةmTLSلجميع الاتصالات وTLS
.بمفاتيح دوريةat restتشفير البيانات الحساسة
WAF،rate limiting،bot protection
.Secure cookies،CSRF،CSP،input validation
.Secret rotation
.SAST،SCA،DAST،IaC scanning
.اختبار اختراق قبل الإطلاق وسنوياً وبعد تغييرات جوهرية 
APIعلى كلObject-level authorization
.ومنع الملفات التنفيذيةFile scanning
.لبيانات الإنتاج في بيئات الاختبارMasking
Broken Object LevelيضعOWASP API Securityيوفر متطلبات قابلة للاختبار لأمن تطبيقات الويب، وOWASP ASVS
 .للخدمات عالية الامتيازmTLSحصراً و HTTPSباستخدامRESTبينما توصي إرشادات، APIsضمن أبرز مخاطرAuthorization
 تضع حماية البيانات والتشفير وإدارة النسخ الاحتياطية والاختبارات وسجلات الأحداث وأمن تطبيقات الويب 2024الأساسية لعامNCAضوابط
تشجع جهات أخرى على الاستفادة من الضوابطNCAنطاق الإلزام الرسمي يعتمد على نوع الجهة، لكن . واستمرارية الأعمال ضمن الضوابط الأساسية 
. خاضعة لكل عناصرها حكماًAGMAالسحابية؛ لذلك تُستخدم هنا كمرجع سعودي قوي، لا كادعاء بأن
النسخ الاحتياطية والتعافي 
العنصرالهدف المقترح
قاعدة البيانات الماليةساعتين≤ RTOدقيقة،RPO ≤ 15
ZATCA Queueالفوترة وساعة≤ RTOدقائق،RPO ≤ 5
ملفات العقود والفواتساعاتRTO ≤ 4ساعة،≤ RPO
BI/Data warehouseساعةRTO ≤ 24ساعة،RPO ≤ 24
الموقع العامساعتين≤ RTOساعة،RPO ≤ 24
:استراتيجية النسخ 
.نسخ مشفرة متعددة المناطق
.لقاعدة البياناتPITR
23
24
25
 •
 •
 •
 •
 •
 •
 •
 •
 •
 •
 •
 •
 •
26
27
 •
 •
18


---
<!-- صفحة 19 -->

.أسبوعيةImmutableنسخة
.شهري لعينةRestoreاختبار
.نصف سنويDR exercise
.سنويFull failover
.مع أسماء ومسوؤوليات واتصالاتRunbooks
.KMSدوري للمفاتيح والوثائق الجوهرية وفق ضوابطOffline export
.منع حساب الإنتاج من حذف النسخ الاحتياطية وحده
تشمل تحديد نطاق النسخ ليغطي الأصول الحرجة، القدرة على الاستعادة السريعة، والاختبار الدوري، كما تشمل خطط الاستجابة واستمرارية NCAضوابط
. الأنظمة وخطط التعافي من الكوارث
الواجهات ولوحات الموؤشرات والتكاملات وتسليم المطور 
هيكل الواجهة
:التنقل الرئيسي
الرئيسية
النمو والمبيعات
الحملات والعملاء المحتملون
الفرص
عروض الأسعار
العقود والتجديدات
العملاء والمشاريع
ملف العميل
المشاريع والتسليمات
الوقت والمصاريف
بوابة العميل
المالية
الفواتير
المدفوعات والتحصيل
الموردون والمشتريات
الخزينة والبنوك
الإيراد
دفتر الأستاذ
التخطيط والتحليلات
الميزانيات
│   ├── Forecast
التقارير
لوحات المؤشرات
الامتثال
│   ├── ZATCA
│   ├── VAT/WHT/Zakat
الخصوصية
التدقيق
الإدارة
الكيانات والفروع
الحسابات والأبعاد
المستخدمون والصلاحيات
• 
• 
• 
• 
• 
• 
• 
28
19


---
<!-- صفحة 20 -->

سير الموافقات
الضرائب والعملات
التكاملات
الإشعارات
CFOنموذج لوحة
┌────────────────────────────────────────────────────────────────────┐
│ AGMA Finance Command Center                     Aug 2026 | SAR     │
├──────────────────┬──────────────────┬──────────────────────────────┤
│ Revenue MTD      │ Gross Margin     │ Cash Available               │
│  842,500         │  47.8%           │  1,920,000                   │
│  ▲ 12.4% vs plan │  ▼ 1.6 pts       │  Runway: 7.4 months          │
├──────────────────┴──────────────────┴──────────────────────────────┤
│ Revenue by Service                                                 │
│ AI & Automation █████████████ 36%                                 │
│ Performance     ██████████    27%                                 │
│ Web & Digital   ███████       19%                                 │
│ Other           ██████        18%                                 │
├───────────────────────────────┬────────────────────────────────────┤
│ AR Aging                      │ Forecast & Risks                   │
│ Current        540k           │ Cash shortfall: none              │
│ 1-30 days      180k           │ ZATCA rejected docs: 3            │
│ 31-60 days      92k           │ Contracts expiring <60d: 8        │
│ >60 days        55k           │ Projects below margin floor: 4    │
├───────────────────────────────┴────────────────────────────────────┤
│ Alerts: [Invoice rejection] [IBAN change] [Budget overrun]         │
└────────────────────────────────────────────────────────────────────┘
KPI catalogue
المجالالموؤشرات 
التسويقSpend،Impressions،Leads،CPL،CAC،ROAS
المبيعاتPipeline،Win rate،Sales cycle،Bookings
العملاءActive clients،Churn،NRR،LTV،Concentration
المشاريعUtilization،On-time delivery،Scope creep،Margin
الإيراد MRR،ARR،recognized،deferred،RPO
ARDSO،Aging،Collection effectiveness،ECL
APDPO،overdue bills،duplicate rate،discounts captured
الخزينةCash runway،forecast accuracy،bank exposure
الضريبةVAT payable،rejected invoices،ling readiness
التشغيلClose days،manual journals،reconciliation exceptions
20


---
<!-- صفحة 21 -->

المجالالموؤشرات 
الأمنPrivileged access،failed logins،open vulnerabilities
:مثال. يحتوي على الصيغة والمصدر والتواتر والمالك والحدودMetric Dictionaryيوضع فيKPIتعريف كل
DSO =
Average Trade Receivables
÷ Credit Revenue for Period
× Number of Days
Owner: Financial Controller
Refresh: Daily
Dimensions: Entity, Client Segment, Service Line
Exclusions: VAT, disputed invoices if separately disclosed
التنبيهات
التنبيهالعتبةالمستلم
ZATCA rejectionأي رفضBilling + Tax
B2C unreported ساعة18بعدTax + Engineering
Certificate expiry يوماً45/30/15Security + Tax
Overdue invoice يوماً7/15/30Collections + AM
Credit limit breachقبل اعتماد العقدFinance
Project marginأقل من الحدPM + CFO
Spend over budget100%/90%Budget owner
Bank mismatchأكثر من يومي عملTreasury
Vendor IBAN changeأي تغيAP manager + Security
Manual journalعطلة/مبلغ مرتفعController
Unusual refundتكرار أو مبلغ مرتفع CFO + Risk
Close delayTask overdueController
Cash runway أشهر4أقل منCEO/CFO
Privileged accessBreak-glassSecurity
APIمواصفات
عبر OpenAPI 3.1،OAuth 2.1/OIDC،versioningمعREST/JSONالمعيار المقترحv1.Webhooks، وتوثيق
21


---
<!-- صفحة 22 -->

MethodEndpointالوظيفة
POST/v1/leadsمن الموقعLeadإنشاء
POST/v1/customersإنشاء ملف عميل
POST/v1/customers/{id}/kyb-submissionsKYBتقديم مستندات
POST/v1/quotesإنشاء عرض
POST/v1/quotes/{id}/approveاعتماد العرض
POST/v1/contractsتحويل عرض إلى عقد
POST/v1/contracts/{id}/activateتفعيل بعد الموافقات
POST/v1/invoicesDraft invoiceإنشاء
POST/v1/invoices/{id}/submit-zatcaClearance/Reporting
GET/v1/invoices/{id}/zatca-statusحالة الإرسال
POST/v1/payment-sessionsCheckoutإنشاء
POST/v1/webhooks/payments/{provider}Webhookاستقبال
POST/v1/payments/{id}/allocateتخصيص دفعة
POST/v1/vendor-billsإدخال فاتورة مورد
POST/v1/payment-runsBatchإنشاء
POST/v1/journalsDraftإنشاء قيد
POST/v1/journals/{id}/postترحيل بعد الموافقة
POST/v1/bank-transactions/importاستيراد كشف 
POST/v1/reconciliationsمطابقة
GET/v1/reports/trial-balanceميزان مراجعة 
GET/v1/reports/management-packحزمة الإدارة
APIقواعد
POST /v1/payment-sessions
Authorization: Bearer <token>
Idempotency-Key: 41f65a96-...
X-Correlation-ID: 8f38d21e-...
Content-Type: application/json
{
"invoice_id": "INV-2026-000123",
"amount": "11500.00",
"currency": "SAR",
22


---
<!-- صفحة 23 -->

"allowed_methods": ["MADA", "APPLE_PAY", "CARD"],
"return_url": "https://client.agma.com.sa/payments/return"
}
:استجابة
{
"payment_session_id": "ps_01J...",
"provider": "licensed_psp",
"status": "PENDING",
"checkout_url": "provider-hosted-url",
"expires_at": "2026-08-07T14:00:00+03:00"
}
:Webhookمتطلبات
public-key verificationأوHMACتوقيع
Timestamp tolerance
.الأصلي المشفرpayloadتخزين
provider event IDحسبIdempotency
إعادة2xx.لا بعد اكتمال كل المعالجة، durable enqueue بعد
Dead-letter queue
.المصدر الوحيدWebhookوعدم اعتبار، settlement fileمعReconciliation
التكاملات
النظامنمط التكاملالبيانات
الموقعAPI/EventLeads،forms،consent
CRM/OdooBi-directionalclients،opportunities،activities
Google/Meta AdsScheduled APIspend،campaign،conversion
Email/CalendarOAuthmeetings،reminders
E-signatureAPI/Webhookenvelopes،signatures
Project managementAPItasks،milestones،time
ZATCAREST/API + certificatesinvoices،notes،status
PSPHosted checkout/Webhookpayments،refunds،settlements
SADAD/bankAPI/SFTPbill refs،collection،statements
Open BankingConsent-based APIbalances،transactions
PayrollAPI/filepayroll journal،liabilities
HRAPIemployees،departments،cost centers
ERPAPI/Event/ETLmaster data،journals
 •
 •
 •
 •
 •
 •
 •
23


---
<!-- صفحة 24 -->

النظامنمط التكاملالبيانات
BICDC/ETLfacts and dimensions
StorageAPIsigned documents،attachments
مخرجات التسليم للمطور
:الحزمة النهائية تشمل. على وثيقة متطلباتHandoffيجب ألا يقتصر
المخرجالصيغةمعيار القبول
Product RequirementsMarkdown/Confluenceجميع القصص مرتبطة بقبول
Domain ModelMermaid + UMLمتوافق مع قاعدة البيانات
ERDdbdiagram/MermaidموثقةPK/FK/cardinality
Data DictionaryCSV/XLSXتعريف ونوع وحساسية لكل حقل
OpenAPIYAML 3.1contract testsوlintيمر
AsyncAPIYAMLWebhookوEventكل
UI WireframesFigmaDesktop/Mobile/RTL
Design systemFigma + StorybookTokens/components/accessibility
Accounting RulesDecision tablesوحالات اختبارDebit=Credit
ZATCA mappingField matrixXML field ↔ database field
Role matrixXLSXpermission × role × entity
Control matrixRCMrisk،control،evidence،owner
Report catalogueSpec sheetsصيغة ومصدر وتواتر
Migration mappingSource-to-targetتحويلات وتحقق
Test packAutomated/manualunit/integration/UAT/security
RunbooksMarkdowndeploy،rollback،DR،incident
Architecture decisionsADRsمبرر وبدائل لكل قرار 
Operations manualPDF/Markdownmonitoring،queues،close
خطة التنفيذ والاختبار والهجرة والمخاطر
الجدول الزمني المقترح 
CRMإلى خمسة أو ستة أشهر إذا اقتصر علىMVPيمكن ضغط.  شهراً، مع إطلاقات مرحلية 12 إلى10المدة الواقعية لإصدار متكامل هي نحو
.الأساسي، لكن ضغط النطاق الكامل يزيد مخاطر المحاسبة والامتثالGLوالتحصيل وZATCAوالعقود والفوترة و
24


---
<!-- صفحة 25 -->

المرحلةالمدةالمخرجات
Discovery & Controls أسابيع4RCM،COA،gapsالعمليات،
Architecture & UX أسابيع4ERD،APIs،prototypes،ADRs
Foundation أسابيع6IAM،entities،master data،audit
CRM/CPQ/Contracts أسابيع8leads،quotes،approvals،contracts
Billing/ZATCA/Payments أسابيع10invoices،tax،PSP،receipts
Projects/Revenue/AR أسابيع8project accounting،IFRS 15،collections
Procurement/AP/Treasury أسابيع8vendors،PO،payments،bank feeds
GL/Close/Tax أسابيع8journals،reconciliation،VAT packs
Budgeting/BI/Consolidation أسابيع8planning،dashboards،group reports
Migration/UAT/Parallel Run أسابيع6converted data،two closes
Go-live/Hypercare أسابيع4production،monitoring،xes
.Accounting RulesوData Modelعدة مسارات تُنفّذ بالتوازي بعد تثبيت 
المعالم
المعلمشرط الإنجاز
Design sign-offCFO،Tax،Operations،Securityاعتماد
Finance core readyGL balanced،periods،COA،dimensions
Revenue flow readyQuote-to-cash end-to-end
ZATCA certification readyناجحةSandbox scenarios
Payments readypayment/refund/settlement tested
First migrated closeمطابقTrial balance
UAT completeلا عيوب حرجة أو عالية مفتوحة
Parallel closetoleranceشهران متتاليان ضمن 
Production launchجاهزةDR،rollback،monitoring
StabilizationSLAإقفال فعلي ضمن
الاختبارات 
نوع الاختبارالتغطية
Unitالضرائب، التسعير، القيود، العملات 
Property-basedDebit=Credit،allocations،rounding
ContractWebhooksوOpenAPI
25


---
<!-- صفحة 26 -->

نوع الاختبارالتغطية
IntegrationZATCA،PSP،bank،payroll
End-to-endPayإلىCash،POإلىLead
Accounting golden casesmilestones،refundsعقود شهرية،
TaxStandard/Simplified/CN/DN
SecurityASVS،API auth،privilege escalation
Performanceinvoice batch،close،dashboard
Resiliencequeue outage،ZATCA timeout،PSP replay
DRrestore/failover/RPO/RTO
UATسيناريوهات كل دور
Regressionكل إصدار
:الأساسيةGolden Accountingحالات
.وإيراد موؤجل VATمفوتر مقدماً معRetainer
.مشروع موقع بثلاث مراحل ودفعة مقدمة 
.ودعم سنويSetupيتضمنAIعقد
Clearanceجزئي بعدCredit note
.PSPتحصيل ناقص ورسوم
ChargebackوRefund
.ثم إعادة تقييمSARلكيانUSDفاتورة
ECLعميل متعثر ومخصص
WHTفاتورة مورد غير مقيم مع
.إلغاء عقد وباقي التزامات أداء 
Grossمع عرضMedia spend
.Netمع عرضMedia spend
.وإقصاءIntercompany invoice
.إقفال وإعادة فتح استثنائية
.ضمن الضوابطRetry ثم ZATCAتعطل
معايير القبول
القبول الوظيفي 
.وتحويله إلى عميل وعرض وعقد ومشروع وفاتورة دون إدخال البيانات الأساسية مرتينLeadيمكن إنشاء
.يدعم العقد أكثر من نموذج تسعير والتزامات أداء متعددة 
.المعتمدMappingمتوافقاً معXMLإنجليزية و/ينتج النظام فاتورة عربية
.والإشعارات الدائنة والمدينة ReportingوClearanceيدعم
.يخصص التحصيل كلياً أو جزئياً أو عبر فواتير متعددة
.وموافقات متعددةPayment runsوway match-3يدعم
AR/AP AgingوCash FlowوBSوP&LوTrial Balanceيولد
.وخطة خمس سنواتBudget/Forecastيدعم
1
 .2
 .3
 .4
 .5
 .6
 .7
 .8
 .9
 .10
 .11
 .12
 .13
 .14
 .15
 •
 •
 •
 •
 •
 •
 •
 •
26


---
<!-- صفحة 27 -->

القبول المحاسبي 
.مجموع المدين يساوي مجموع الدائن في جميع القيود
100بنسبةGLمعSubledgersتطابق أرصدة
Clearedلا يمكن تعديل قيد مرحل أو فاتورة
Contract assets/liabilitiesيعيد بناء رصيدRevenue waterfall
.قابلة للعكس والتدقيقFX revaluation
.Intercompany difference reportتنتجConsolidation
.غير معتمد إلا باستثناء موثقReconciliationلا يُقفل الشهر مع
القبول الضريبي 
.المتفق عليهاZATCA Sandboxنجاح جميع سيناريوهات
SimplifiedوStandardالتمييز الصحيح ب
. ساعة للفواتير المبسطة24مراقبة نافذة 
.والفواتيرGLيتطابق معVAT return workpaper
.والمستند المرئيhashوالرد والـXMLحفظ
.ينبه قبل المواعيدTax calendar
القبول الأمني والتشغيلي 
.فعالونSoDوleast privilegeوMFA
.لا توجد ثغرات حرجة أو عالية غير معالجة 
replayومحمية من، idempotentموقعة،Webhooks
.Hosted Checkoutعند استخدامAGMAبيانات البطاقة لا تمر أو تُخزن في قاعدة
.المستهدفينRPO/RTOاستعادة قاعدة البيانات ضمن
.سجل التدقيق لا يقبل التعديل من مستخدم التطبيق
.نجاح اختبار تحميل عند ضعف الحمل المتوقع ثلاث مرات 
ZATCA،PSP،queues،database،securityيغطيMonitoring
خطة الهجرة
:خطوات الهجرة
.وملف محاسبي ومجلد مستنداتOdoo/NotionوGoogle SheetلكلInventory
.الحساسية، الجودة، والفترة، Ownerتصنيف النظام المصدر
Source-to-target mappingتعريف
.تنظيف العملاء والموردين وإزالة التكرار 
.توحيد الخدمات والضرائب والعملات 
Master dataتحميل
.تحميل العقود المفتوحة والمشاريع
.تحميل الفواتير والمدفوعات المفتوحة
.وأرصدة افتتاحيةTrial balanceتحميل
.للباقيArchiveتحميل تاريخ مختار للتقارير، و
.مالي وضريبيReconciliation
.أول وثانDry run
.Cutover freeze
.Final delta load
.والمراجع الداخلي CFOمنSign-off
:استراتيجية التاريخ 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
• 
1
 .2
 .3
 .4
 .5
 .6
 .7
 .8
 .9
 .10
 .11
 .12
 .13
 .14
 .15
27


---
<!-- صفحة 28 -->

البياناتالاستراتيجية 
العملاء والموردون النشطونهجرة كاملة
العقود النشطةهجرة بتفاصيل الالتزامات 
الفواتير المفتوحةتفاصيل كاملة
السنة الحاليةتفاصيل معاملات
سنة أو سنتان سابقتانبحسب جودة المصدر
تاريخ أقدمقابل للبحثArchive
القديمAudit trailحفظ كما هو، لا اختلاق أحداث
ZATCAملفاتوالردود الأصليةXMLحفظ
:لإقفالين شهريين متتاليين، مع مقارنةParallel Runيجب إجراء 
Trial balance
.AR/AP
.Revenue
.VAT
.Bank balances
.Deferred revenue
.Project margins
.Management pack
المخاطر والتخفيف
الخطرالأثرالتخفيف
ضخم دفعة واحدةERPتحويل المشروع إلىتأخير وفشل تبنيواضحMVPإطلاقات مرحلية و
IFRS 15سوء تفسإيراد غير صحيح Golden casesسياسات معتمدة و
خاطئ للإنفاق الإعلانيGross/Netتضخيم إيراد لكل نموذجPrincipal-Agent memo
ZATCAرفض فواتتعطيل الفوترةValidator،sandbox،queue،monitoring
EGSانتهاء شهادةتوقف الإرسال يوماً45/30/15تنبيهات
Webhooksتكرار دفعات مزدوجةunique provider IDsوidempotency
IBANاحتيال تغيخسارة نقديةdual approvalمستقل وcallback
تشتت بيانات العملاءتقارير غير موثوقةdeduplicationوParty master
صلاحيات واسعةاحتيال أو خطأSoD،MFA،periodic access review
بيانات شخصية خارج المملكةPDPLمخالفةrisk assessmentوtransfer register
تخزين بيانات بطاقاتومخاطرPCIتوسعtokenizationوhosted checkout
PSPعدم تطابق البنك وأرصدة خاطئةيوميsettlement reconciliation
 •
 •
 •
 •
 •
 •
 •
 •
28


---
<!-- صفحة 29 -->

الخطرالأثرالتخفيف
هجرة ضعيفة الجودةأرصدة افتتاحية خاطئةnancial sign-offوdry runs
إغلاق شهري يدويتأخير وتقلبautomationوclose checklist
ربط قوي بمزود واحدVendor lock-inexport rightsوAdapter interfaces
مبكرةMicroservicesتعقيد تشغيليأولاً Modular monolith
تقارير من قاعدة الإنتاجبطء وعدم اتساقsemantic layerوDWH
في القيود بلا رقابةAIاستخدامأخطاء غير مفسرةللاقتراح فقط، اعتماد بشري AI
فشل النسخ الاحتياطية الصامتفقد بياناتautomated restore tests
ضعف التبنيّ عودة للجداولparallel shadow systemsمنع، championsتدريب،
مراجع التنفيذ الأساسية 
للفوترة الإلكترونية، الدليل الفني ومواصفةZATCAلوائح: المراجع السعودية الأساسية التي يجب أن تُحفظ نسخها المعتمدة داخل مستودع المشروع هي 
Openللدفع وSAMAولائحته ونقل البيانات؛ قواعدPDPL؛SOCPAولوائحه؛ نظام الشركات؛ معايVATوقاموس البيانات؛ نظامXML
 .كمرجعية أمنية سعوديةNCAعند استخدام التكاملات المصرفية؛ وضوابطBanking
:أما المراجع العالمية المهنية المقترحة لفريق التصميم والمراجعة فهي 
المجالالمرجع
RevenueIFRS 15 Revenue from Contracts with Customers
Credit lossesIFRS 9 Financial Instruments
Foreign currencyIAS 21
Cash flowIAS 7
Internal controlCOSO Internal Control—Integrated Framework
Payment securityPCI DSS v4.0.1
Application securityOWASP API SecurityوOWASP ASVS
Accounting systemsAccounting Information SystemsRomney & Steinbart — 
Process designFundamentals of Business Process Management.Dumas et al — 
Data warehousingThe Data Warehouse ToolkitKimball & Ross — 
ArchitectureSoftware Architecture: The Hard Parts.Ford et al — 
Data-intensive systemsDesigning Data-Intensive ApplicationsMartin Kleppmann — 
Enterprise architectureEnterprise Architecture as StrategyRoss, Weill & Robertson — 
الكاملIFRSمعتمد من الإدارة والمحاسب القانوني، لأن اختيارAccounting Policy Manualالمرجعية المحاسبية النهائية يجب أن تُثبت في
والاعتراف عبر الزمن، والزكاة وضريبة الدخل، يتوقف على الحقائق القانونية ، Principal-Agentومعالجة تكاليف العقود، والـ، IFRS for SMEsأو
. والتعاقدية الفعلية للمنشأة
29
30
29


---
<!-- صفحة 30 -->

وكالة جيل الذكاء الاصطناعي| AGMA
/https://agma.com.sa
AGMA | AGMA | كيف نبدأ العمل معك؟ نموذج التعاون
https://agma.com.sa/process
AGMA | وكالة جيل الذكاء الاصطناعيAGMA | سياسة الخصوصية
https://agma.com.sa/privacy-policy
... Implementing Regulations of Payments and
?https://rulebook.sama.gov.sa/en/implementing-regulations-payments-and-payment-services-law
utm_source=chatgpt.com
AGMA | شفافية في القيمةAGMA | التسع
https://agma.com.sa/pricing
... International Financial Reporting Standard 15Revenue
?https://www.ifrs.org/content/dam/ifrs/publications/html-standards/english/2024/issued/ifrs15.html
utm_source=chatgpt.com
-https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-invoicing-Detailed
Technical-Guideline.pdf
https://zatca.gov.sa/en/E-Invoicing/Introduction/Guidelines/Documents/E-invoicing-Detailed-Technical-Guideline.pdf
Entire Section | SAMA Rulebook
https://rulebook.sama.gov.sa/en/entiresection/4561?utm_source=chatgpt.com
Just Published: PCI DSS v4.0.1
https://blog.pcisecuritystandards.org/just-published-pci-dss-v4-0-1?utm_source=chatgpt.com
Companies Law
-https://mc.gov.sa/regapis?attId=0d5e00e7-1ea3-4890-a16a
af8700f9eb32&display=true&dt=03072026091255&isInline=false&lng=en&op=Download&siteURL=https%3A%2F%2Fregulations.mc.gov.sa%2F&utm_source=chatgpt.com
-https://www.ifrs.org/content/dam/ifrs/meetings/2024/january/iasb/ap30c-impairment-of
financial-assets.pdf
https://www.ifrs.org/content/dam/ifrs/meetings/2024/january/iasb/ap30c-impairment-of-financial-assets.pdf
Open Banking in Saudi Arabia
https://openbanking.sama.gov.sa/index-en.html?utm_source=chatgpt.com
/https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows
/https://www.ifrs.org/issued-standards/list-of-standards/ias-7-statement-of-cash-flows
-https://www.ifrs.org/issued-standards/list-of-standards/ias-21-the-effects-of-changes-in-foreign
/exchange-rates
/https://www.ifrs.org/issued-standards/list-of-standards/ias-21-the-effects-of-changes-in-foreign-exchange-rates
... VAT - Amendments to the Implementing Regulation of
-https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Amendments-to-the-Implementing-Regulation-of
%28VAT%29.PDF?utm_source=chatgpt.com
Roll-out phases
https://zatca.gov.sa/en/E-Invoicing/Introduction/Pages/Roll-out-phases.aspx?utm_source=chatgpt.com
-https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-on-Imports-and-Exports
under-VAT-Provision.pdf
https://zatca.gov.sa/en/HelpCenter/guidelines/Documents/Guideline-on-Imports-and-Exports-under-VAT-Provision.pdf
https://zatca.gov.sa/en/eServices/Pages/eServices-04


---
<!-- صفحة 31 -->

Internal Control - Integrated Framework
https://www.coso.org/guidance-on-ic?utm_source=chatgpt.com
Logging - OWASP Cheat Sheet Series
https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html?utm_source=chatgpt.com
Data Protection | Saudi Data & AI Authority
https://sdaia.gov.sa/en/Research/Pages/DataProtection.aspx?utm_source=chatgpt.com
/https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom/%21ut/p/z1
-_jZDLDoIwEEW_hQ8wLTSgLvGRCIiiPMRuTBNKaQKFQHHh11tZSgRnN8m5mTkXYJACLMiTMyJ5LUip9ju2Ho69tw56CA092ZjQQv7JND1kwGgJbl9AnKwVcDF813YQDBDA
/Thj7HhXN6dA5SB0fpbnwHcEFksuMhrkF4p68tBshYBbbuP7I5IErVEdDltz73seEZlQT0uWFZX6lE8eWqFRsC4iwGYkG2qOH0d89BhmvYGeqrWEA%21%21/dz/d5
/L0lDUmlTUSEhL3dHa0FKRnNBLzROV3FpQSEhL2Vu
/https://dgp.sdaia.gov.sa/wps/portal/pdp/knowledgecenter/details/RegulationonPersonalDataTransferOutsidetheKingdom/%21ut/p/z1
-_jZDLDoIwEEW_hQ8wLTSgLvGRCIiiPMRuTBNKaQKFQHHh11tZSgRnN8m5mTkXYJACLMiTMyJ5LUip9ju2Ho69tw56CA092ZjQQv7JND1kwGgJbl9AnKwVcDF813YQDBDA
/Thj7HhXN6dA5SB0fpbnwHcEFksuMhrkF4p68tBshYBbbuP7I5IErVEdDltz73seEZlQT0uWFZX6lE8eWqFRsC4iwGYkG2qOH0d89BhmvYGeqrWEA%21%21/dz/d5
/L0lDUmlTUSEhL3dHa0FKRnNBLzROV3FpQSEhL2Vu
https://sdaia.gov.sa/en/SDAIA/about/Documents/ExecutiveRegulations.pdf
https://sdaia.gov.sa/en/SDAIA/about/Documents/ExecutiveRegulations.pdf
OWASP Application Security Verification Standard (ASVS)
https://owasp.org/www-project-application-security-verification-standard/?utm_source=chatgpt.com
-https://cdn.nca.gov.sa/api/files/public/upload/86e09090-44e4-481f
bc28-355673607654_ECC--2024-EN.pdf
https://cdn.nca.gov.sa/api/files/public/upload/86e09090-44e4-481f-bc28-355673607654_ECC--2024-EN.pdf
E-Invoicing
https://zatca.gov.sa/en/E-Invoicing/Pages/default.aspx?utm_source=chatgpt.com
IFRS 15 Revenue from Contracts with Customers
?/https://www.ifrs.org/issued-standards/list-of-standards/ifrs-15-revenue-from-contracts-with-customers
utm_source=chatgpt.com
21
22
23
24
25
26
2728
29
30
31
