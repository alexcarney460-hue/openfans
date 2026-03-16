import type { LanguageCode } from "./languages";

// ---------------------------------------------------------------------------
// Translation keys — organized by section
// ---------------------------------------------------------------------------
export type TranslationKey =
  // Header nav
  | "nav.home"
  | "nav.explore"
  | "nav.pricing"
  | "nav.login"
  | "nav.signup"
  | "nav.dashboard"
  // Hero
  | "hero.title.line1"
  | "hero.title.accent"
  | "hero.subtitle"
  | "hero.tagline"
  | "hero.cta.earn"
  | "hero.cta.browse"
  // Social proof
  | "social.creators"
  | "social.earned"
  | "social.subscribers"
  | "social.fees"
  | "social.payouts"
  // Value props
  | "value.keep95.title"
  | "value.keep95.desc"
  | "value.instant.title"
  | "value.instant.desc"
  | "value.noRestrictions.title"
  | "value.noRestrictions.desc"
  // How it works
  | "howItWorks.title"
  | "howItWorks.creators"
  | "howItWorks.fans"
  | "howItWorks.creator.step1.title"
  | "howItWorks.creator.step1.desc"
  | "howItWorks.creator.step2.title"
  | "howItWorks.creator.step2.desc"
  | "howItWorks.creator.step3.title"
  | "howItWorks.creator.step3.desc"
  | "howItWorks.fan.step1.title"
  | "howItWorks.fan.step1.desc"
  | "howItWorks.fan.step2.title"
  | "howItWorks.fan.step2.desc"
  | "howItWorks.fan.step3.title"
  | "howItWorks.fan.step3.desc"
  // Feature highlights
  | "features.title"
  | "features.subtitle"
  | "features.usdc.title"
  | "features.usdc.desc"
  | "features.lowFees.title"
  | "features.lowFees.desc"
  | "features.messaging.title"
  | "features.messaging.desc"
  | "features.analytics.title"
  | "features.analytics.desc"
  | "features.referral.title"
  | "features.referral.desc"
  | "features.kyc.title"
  | "features.kyc.desc"
  // Creator showcase
  | "showcase.title"
  | "showcase.subtitle"
  | "showcase.seeAll"
  // Bottom CTA
  | "cta.title"
  | "cta.subtitle"
  | "cta.button"
  | "cta.creators.title"
  | "cta.creators.button"
  | "cta.fans.title"
  | "cta.fans.button"
  // Dashboard sidebar
  | "dash.home"
  | "dash.explore"
  | "dash.subscriptions"
  | "dash.bookmarks"
  | "dash.posts"
  | "dash.stories"
  | "dash.live"
  | "dash.aiStudio"
  | "dash.aiChat"
  | "dash.newPost"
  | "dash.messages"
  | "dash.subscribers"
  | "dash.earnings"
  | "dash.analytics"
  | "dash.wallet"
  | "dash.promotions"
  | "dash.affiliates"
  | "dash.referrals"
  | "dash.notifications"
  | "dash.verification"
  | "dash.tax"
  | "dash.support"
  | "dash.settings"
  | "dash.group.content"
  | "dash.group.audience"
  | "dash.group.money"
  | "dash.group.account"
  | "dash.accountType"
  | "dash.admin"
  | "dash.creator"
  | "dash.fan"
  | "dash.myProfile"
  | "dash.signOut"
  // Common
  | "common.loading"
  | "common.error"
  | "common.retry";

// English must be complete; other languages fall back to English for missing keys
type TranslationMapComplete = Record<TranslationKey, string>;
type TranslationMapPartial = Partial<Record<TranslationKey, string>>;

const translations: Record<LanguageCode, TranslationMapComplete | TranslationMapPartial> & {
  en: TranslationMapComplete;
} = {
  // -----------------------------------------------------------------------
  // English
  // -----------------------------------------------------------------------
  en: {
    "nav.home": "Home",
    "nav.explore": "Explore",
    "nav.pricing": "Pricing",
    "nav.login": "Log In",
    "nav.signup": "Sign Up",
    "nav.dashboard": "Dashboard",
    "hero.title.line1": "The creator platform",
    "hero.title.accent": "that pays more.",
    "hero.subtitle":
      "Share exclusive content, build real community, and keep more of what you earn. Fans subscribe. You get paid. Simple.",
    "hero.tagline": "Lower fees. Crypto-native. Creator-first.",
    "hero.cta.earn": "Join as Creator",
    "hero.cta.browse": "Explore Creators",
    "social.creators": "creators",
    "social.earned": "earned this month",
    "social.subscribers": "subscribers",
    "social.fees": "5-10% fees vs 20%",
    "social.payouts": "Instant payouts",
    "value.keep95.title": "Keep up to 95%",
    "value.keep95.desc":
      "Just 5% platform fee on tips and subscriptions. The lowest in the industry.",
    "value.instant.title": "Get paid instantly",
    "value.instant.desc": "No 7-day holds. Withdraw whenever you want.",
    "value.noRestrictions.title": "No restrictions",
    "value.noRestrictions.desc":
      "Your content, your rules. We don't police creators.",
    "howItWorks.title": "How it works",
    "howItWorks.creators": "For Creators",
    "howItWorks.fans": "For Fans",
    "howItWorks.creator.step1.title": "Sign up & verify",
    "howItWorks.creator.step1.desc": "Create your account and complete identity verification in minutes.",
    "howItWorks.creator.step2.title": "Set your price & post",
    "howItWorks.creator.step2.desc": "Choose your subscription price and start sharing exclusive content.",
    "howItWorks.creator.step3.title": "Get paid in USDC",
    "howItWorks.creator.step3.desc": "Receive instant payouts directly to your wallet. No holds, no delays.",
    "howItWorks.fan.step1.title": "Connect your wallet",
    "howItWorks.fan.step1.desc": "Link your Phantom wallet to get started in seconds.",
    "howItWorks.fan.step2.title": "Subscribe to creators",
    "howItWorks.fan.step2.desc": "Find and subscribe to your favorite creators with USDC.",
    "howItWorks.fan.step3.title": "Enjoy exclusive content",
    "howItWorks.fan.step3.desc": "Access premium posts, messages, and more from creators you love.",
    "features.title": "Everything you need to succeed",
    "features.subtitle": "Built for creators who want more control, more money, and more freedom.",
    "features.usdc.title": "Instant USDC payouts",
    "features.usdc.desc": "Get paid the moment a fan subscribes. No waiting, no middlemen.",
    "features.lowFees.title": "5-10% fees",
    "features.lowFees.desc": "Keep up to 95% of every dollar. OnlyFans takes 20%.",
    "features.messaging.title": "Built-in messaging",
    "features.messaging.desc": "Chat directly with your subscribers. Offer paid DMs for extra revenue.",
    "features.analytics.title": "Creator analytics",
    "features.analytics.desc": "Track your growth, revenue, and engagement with real-time dashboards.",
    "features.referral.title": "Referral program",
    "features.referral.desc": "Earn 5% of referred creator earnings for 12 months.",
    "features.kyc.title": "Age verification & KYC",
    "features.kyc.desc": "Built-in compliance keeps your platform safe and trustworthy.",
    "showcase.title": "Discover creators you will love",
    "showcase.subtitle":
      "Fitness coaches, artists, chefs, analysts, and more.",
    "showcase.seeAll": "See all creators",
    "cta.title": "Ready to earn on your terms?",
    "cta.subtitle":
      "Join thousands of creators who chose a platform that respects their work and their wallet.",
    "cta.button": "Start Earning Today",
    "cta.creators.title": "Ready to start earning?",
    "cta.creators.button": "Sign Up as Creator",
    "cta.fans.title": "Ready to explore?",
    "cta.fans.button": "Browse Creators",
    "dash.home": "Home",
    "dash.explore": "Explore Creators",
    "dash.subscriptions": "My Subscriptions",
    "dash.bookmarks": "Bookmarks",
    "dash.posts": "My Posts",
    "dash.stories": "Stories",
    "dash.live": "Live",
    "dash.aiStudio": "AI Studio",
    "dash.aiChat": "AI Chat",
    "dash.newPost": "New Post",
    "dash.messages": "Messages",
    "dash.subscribers": "Subscribers",
    "dash.earnings": "Earnings",
    "dash.analytics": "Analytics",
    "dash.wallet": "Wallet",
    "dash.promotions": "Promotions",
    "dash.affiliates": "Affiliates",
    "dash.referrals": "Referrals",
    "dash.notifications": "Notifications",
    "dash.verification": "Verification",
    "dash.tax": "Tax Info",
    "dash.support": "Support",
    "dash.settings": "Settings",
    "dash.group.content": "Content",
    "dash.group.audience": "Audience",
    "dash.group.money": "Money",
    "dash.group.account": "Account",
    "dash.accountType": "Account Type",
    "dash.admin": "Admin",
    "dash.creator": "Creator",
    "dash.fan": "Fan",
    "dash.myProfile": "My Profile",
    "dash.signOut": "Sign Out",
    "common.loading": "Loading...",
    "common.error": "Something went wrong",
    "common.retry": "Try again",
  },

  // -----------------------------------------------------------------------
  // Spanish
  // -----------------------------------------------------------------------
  es: {
    "nav.home": "Inicio",
    "nav.explore": "Explorar",
    "nav.pricing": "Precios",
    "nav.login": "Iniciar sesion",
    "nav.signup": "Registrarse",
    "nav.dashboard": "Panel",
    "hero.title.line1": "La plataforma de creadores",
    "hero.title.accent": "que paga mas.",
    "hero.subtitle":
      "Comparte contenido exclusivo, construye comunidad real y conserva mas de lo que ganas. Los fans se suscriben. Tu cobras. Asi de simple.",
    "hero.tagline": "Menos comisiones. Cripto-nativo. Creador primero.",
    "hero.cta.earn": "Unirse como creador",
    "hero.cta.browse": "Explorar creadores",
    "social.creators": "creadores",
    "social.earned": "ganado este mes",
    "social.subscribers": "suscriptores",
    "social.fees": "5-10% comisiones vs 20%",
    "social.payouts": "Pagos instantaneos",
    "value.keep95.title": "Queda con el 95%",
    "value.keep95.desc":
      "Solo un 5% de comision en propinas y suscripciones. La mas baja del sector.",
    "value.instant.title": "Cobro instantaneo",
    "value.instant.desc":
      "Sin esperas de 7 dias. Retira cuando quieras.",
    "value.noRestrictions.title": "Sin restricciones",
    "value.noRestrictions.desc":
      "Tu contenido, tus reglas. No censuramos a los creadores.",
    "showcase.title": "Descubre creadores que amaras",
    "showcase.subtitle":
      "Entrenadores, artistas, chefs, analistas y mas.",
    "showcase.seeAll": "Ver todos los creadores",
    "cta.title": "Listo para ganar en tus propios terminos?",
    "cta.subtitle":
      "Unete a miles de creadores que eligieron una plataforma que respeta su trabajo y su billetera.",
    "cta.button": "Empieza a ganar hoy",
    "dash.home": "Inicio",
    "dash.explore": "Explorar creadores",
    "dash.subscriptions": "Mis suscripciones",
    "dash.bookmarks": "Marcadores",
    "dash.posts": "Mis publicaciones",
    "dash.newPost": "Nueva publicacion",
    "dash.messages": "Mensajes",
    "dash.subscribers": "Suscriptores",
    "dash.earnings": "Ganancias",
    "dash.stories": "Historias",
    "dash.live": "En vivo",
    "dash.aiStudio": "Estudio IA",
    "dash.aiChat": "Chat IA",
    "dash.analytics": "Analiticas",
    "dash.wallet": "Billetera",
    "dash.promotions": "Promociones",
    "dash.affiliates": "Afiliados",
    "dash.referrals": "Referidos",
    "dash.notifications": "Notificaciones",
    "dash.verification": "Verificacion",
    "dash.tax": "Impuestos",
    "dash.support": "Soporte",
    "dash.settings": "Configuracion",
    "dash.group.content": "Contenido",
    "dash.group.audience": "Audiencia",
    "dash.group.money": "Dinero",
    "dash.group.account": "Cuenta",
    "dash.accountType": "Tipo de cuenta",
    "dash.admin": "Administrador",
    "dash.creator": "Creador",
    "dash.fan": "Fan",
    "dash.myProfile": "Mi perfil",
    "dash.signOut": "Cerrar sesion",
    "common.loading": "Cargando...",
    "common.error": "Algo salio mal",
    "common.retry": "Intentar de nuevo",
  },

  // -----------------------------------------------------------------------
  // French
  // -----------------------------------------------------------------------
  fr: {
    "nav.home": "Accueil",
    "nav.explore": "Explorer",
    "nav.pricing": "Tarifs",
    "nav.login": "Connexion",
    "nav.signup": "S'inscrire",
    "nav.dashboard": "Tableau de bord",
    "hero.title.line1": "La plateforme de createurs",
    "hero.title.accent": "qui paie plus.",
    "hero.subtitle":
      "Partagez du contenu exclusif, construisez une vraie communaute et gardez plus de ce que vous gagnez. Les fans s'abonnent. Vous etes paye. Simple.",
    "hero.cta.earn": "Commencez a gagner",
    "hero.cta.browse": "Parcourir les createurs",
    "social.creators": "createurs",
    "social.earned": "gagnes ce mois",
    "social.subscribers": "abonnes",
    "value.keep95.title": "Gardez jusqu'a 95%",
    "value.keep95.desc":
      "Seulement 5% de frais sur les pourboires et abonnements. Le plus bas du marche.",
    "value.instant.title": "Paiement instantane",
    "value.instant.desc":
      "Pas d'attente de 7 jours. Retirez quand vous voulez.",
    "value.noRestrictions.title": "Aucune restriction",
    "value.noRestrictions.desc":
      "Votre contenu, vos regles. Nous ne censurons pas les createurs.",
    "showcase.title": "Decouvrez des createurs que vous aimerez",
    "showcase.subtitle":
      "Coachs fitness, artistes, chefs, analystes et plus encore.",
    "showcase.seeAll": "Voir tous les createurs",
    "cta.title": "Pret a gagner a vos conditions ?",
    "cta.subtitle":
      "Rejoignez des milliers de createurs qui ont choisi une plateforme qui respecte leur travail et leur portefeuille.",
    "cta.button": "Commencez a gagner",
    "dash.home": "Accueil",
    "dash.explore": "Explorer les createurs",
    "dash.subscriptions": "Mes abonnements",
    "dash.bookmarks": "Signets",
    "dash.posts": "Mes publications",
    "dash.newPost": "Nouvelle publication",
    "dash.messages": "Messages",
    "dash.subscribers": "Abonnes",
    "dash.earnings": "Revenus",
    "dash.stories": "Stories",
    "dash.live": "En direct",
    "dash.aiStudio": "Studio IA",
    "dash.aiChat": "Chat IA",
    "dash.analytics": "Analytique",
    "dash.wallet": "Portefeuille",
    "dash.promotions": "Promotions",
    "dash.affiliates": "Affilies",
    "dash.referrals": "Parrainages",
    "dash.notifications": "Notifications",
    "dash.verification": "Verification",
    "dash.tax": "Fiscalite",
    "dash.support": "Assistance",
    "dash.settings": "Parametres",
    "dash.accountType": "Type de compte",
    "dash.admin": "Administrateur",
    "dash.creator": "Createur",
    "dash.fan": "Fan",
    "dash.myProfile": "Mon profil",
    "dash.signOut": "Deconnexion",
    "common.loading": "Chargement...",
    "common.error": "Quelque chose a mal tourne",
    "common.retry": "Reessayer",
  },

  // -----------------------------------------------------------------------
  // Portuguese
  // -----------------------------------------------------------------------
  pt: {
    "nav.home": "Inicio",
    "nav.explore": "Explorar",
    "nav.pricing": "Precos",
    "nav.login": "Entrar",
    "nav.signup": "Cadastrar",
    "nav.dashboard": "Painel",
    "hero.title.line1": "A plataforma de criadores",
    "hero.title.accent": "que paga mais.",
    "hero.subtitle":
      "Compartilhe conteudo exclusivo, construa comunidade real e fique com mais do que voce ganha. Fas assinam. Voce recebe. Simples.",
    "hero.cta.earn": "Comece a ganhar hoje",
    "hero.cta.browse": "Explorar criadores",
    "social.creators": "criadores",
    "social.earned": "ganhos este mes",
    "social.subscribers": "assinantes",
    "value.keep95.title": "Fique com ate 95%",
    "value.keep95.desc":
      "Apenas 5% de taxa em gorjetas e assinaturas. A mais baixa do mercado.",
    "value.instant.title": "Pagamento instantaneo",
    "value.instant.desc":
      "Sem espera de 7 dias. Saque quando quiser.",
    "value.noRestrictions.title": "Sem restricoes",
    "value.noRestrictions.desc":
      "Seu conteudo, suas regras. Nao policiamos criadores.",
    "showcase.title": "Descubra criadores que voce vai amar",
    "showcase.subtitle":
      "Personal trainers, artistas, chefs, analistas e mais.",
    "showcase.seeAll": "Ver todos os criadores",
    "cta.title": "Pronto para ganhar nos seus termos?",
    "cta.subtitle":
      "Junte-se a milhares de criadores que escolheram uma plataforma que respeita seu trabalho e sua carteira.",
    "cta.button": "Comece a ganhar hoje",
    "dash.home": "Inicio",
    "dash.explore": "Explorar criadores",
    "dash.subscriptions": "Minhas assinaturas",
    "dash.bookmarks": "Favoritos",
    "dash.posts": "Minhas publicacoes",
    "dash.newPost": "Nova publicacao",
    "dash.messages": "Mensagens",
    "dash.subscribers": "Assinantes",
    "dash.earnings": "Ganhos",
    "dash.stories": "Stories",
    "dash.live": "Ao vivo",
    "dash.aiStudio": "Estudio IA",
    "dash.aiChat": "Chat IA",
    "dash.analytics": "Analises",
    "dash.wallet": "Carteira",
    "dash.promotions": "Promocoes",
    "dash.affiliates": "Afiliados",
    "dash.referrals": "Indicacoes",
    "dash.notifications": "Notificacoes",
    "dash.verification": "Verificacao",
    "dash.settings": "Configuracoes",
    "dash.accountType": "Tipo de conta",
    "dash.admin": "Administrador",
    "dash.creator": "Criador",
    "dash.fan": "Fa",
    "dash.myProfile": "Meu perfil",
    "dash.signOut": "Sair",
    "common.loading": "Carregando...",
    "common.error": "Algo deu errado",
    "common.retry": "Tentar novamente",
  },

  // -----------------------------------------------------------------------
  // German
  // -----------------------------------------------------------------------
  de: {
    "nav.home": "Startseite",
    "nav.explore": "Entdecken",
    "nav.pricing": "Preise",
    "nav.login": "Anmelden",
    "nav.signup": "Registrieren",
    "nav.dashboard": "Dashboard",
    "hero.title.line1": "Die Creator-Plattform",
    "hero.title.accent": "die mehr zahlt.",
    "hero.subtitle":
      "Teile exklusive Inhalte, baue echte Community auf und behalte mehr von dem, was du verdienst. Fans abonnieren. Du wirst bezahlt. Einfach.",
    "hero.cta.earn": "Heute anfangen zu verdienen",
    "hero.cta.browse": "Creators durchsuchen",
    "social.creators": "Creators",
    "social.earned": "diesen Monat verdient",
    "social.subscribers": "Abonnenten",
    "value.keep95.title": "Behalte bis zu 95%",
    "value.keep95.desc":
      "Nur 5% Plattformgebuhr auf Trinkgelder und Abonnements. Die niedrigste der Branche.",
    "value.instant.title": "Sofort bezahlt",
    "value.instant.desc":
      "Keine 7-Tage-Wartezeit. Auszahlung wann du willst.",
    "value.noRestrictions.title": "Keine Einschrankungen",
    "value.noRestrictions.desc":
      "Dein Content, deine Regeln. Wir zensieren keine Creators.",
    "showcase.title": "Entdecke Creators, die du lieben wirst",
    "showcase.subtitle":
      "Fitness-Coaches, Kunstler, Koche, Analysten und mehr.",
    "showcase.seeAll": "Alle Creators anzeigen",
    "cta.title": "Bereit, zu deinen Bedingungen zu verdienen?",
    "cta.subtitle":
      "Schliess dich Tausenden von Creators an, die eine Plattform gewahlt haben, die ihre Arbeit und ihr Portemonnaie respektiert.",
    "cta.button": "Heute anfangen zu verdienen",
    "dash.home": "Startseite",
    "dash.explore": "Creators entdecken",
    "dash.subscriptions": "Meine Abonnements",
    "dash.bookmarks": "Lesezeichen",
    "dash.posts": "Meine Beitrage",
    "dash.newPost": "Neuer Beitrag",
    "dash.messages": "Nachrichten",
    "dash.subscribers": "Abonnenten",
    "dash.earnings": "Einnahmen",
    "dash.stories": "Stories",
    "dash.live": "Live",
    "dash.aiStudio": "KI-Studio",
    "dash.aiChat": "KI-Chat",
    "dash.analytics": "Analysen",
    "dash.wallet": "Wallet",
    "dash.promotions": "Aktionen",
    "dash.affiliates": "Affiliates",
    "dash.referrals": "Empfehlungen",
    "dash.notifications": "Benachrichtigungen",
    "dash.verification": "Verifizierung",
    "dash.settings": "Einstellungen",
    "dash.accountType": "Kontotyp",
    "dash.admin": "Administrator",
    "dash.creator": "Creator",
    "dash.fan": "Fan",
    "dash.myProfile": "Mein Profil",
    "dash.signOut": "Abmelden",
    "common.loading": "Wird geladen...",
    "common.error": "Etwas ist schiefgelaufen",
    "common.retry": "Erneut versuchen",
  },

  // -----------------------------------------------------------------------
  // Japanese
  // -----------------------------------------------------------------------
  ja: {
    "nav.home": "\u30DB\u30FC\u30E0",
    "nav.explore": "\u63A2\u7D22",
    "nav.pricing": "\u6599\u91D1",
    "nav.login": "\u30ED\u30B0\u30A4\u30F3",
    "nav.signup": "\u65B0\u898F\u767B\u9332",
    "nav.dashboard": "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9",
    "hero.title.line1": "\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0",
    "hero.title.accent": "\u3082\u3063\u3068\u7A3C\u3052\u308B\u3002",
    "hero.subtitle":
      "\u9650\u5B9A\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u5171\u6709\u3057\u3001\u672C\u7269\u306E\u30B3\u30DF\u30E5\u30CB\u30C6\u30A3\u3092\u69CB\u7BC9\u3057\u3001\u53CE\u76CA\u3092\u3082\u3063\u3068\u4FDD\u3061\u307E\u3057\u3087\u3046\u3002\u30D5\u30A1\u30F3\u304C\u8CFC\u8AAD\u3002\u3042\u306A\u305F\u306F\u5831\u916C\u3092\u5F97\u308B\u3002\u30B7\u30F3\u30D7\u30EB\u3002",
    "hero.cta.earn": "\u4ECA\u3059\u3050\u59CB\u3081\u308B",
    "hero.cta.browse": "\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3092\u63A2\u3059",
    "social.creators": "\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC",
    "social.earned": "\u4ECA\u6708\u306E\u53CE\u76CA",
    "social.subscribers": "\u8CFC\u8AAD\u8005",
    "value.keep95.title": "\u6700\u592795%\u4FDD\u6301",
    "value.keep95.desc":
      "\u30C1\u30C3\u30D7\u3068\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3\u306B\u305F\u3063\u305F5%\u306E\u624B\u6570\u6599\u3002\u696D\u754C\u6700\u5B89\u3002",
    "value.instant.title": "\u5373\u5EA7\u306B\u652F\u6255\u3044",
    "value.instant.desc":
      "7\u65E5\u9593\u306E\u4FDD\u7559\u306A\u3057\u3002\u3044\u3064\u3067\u3082\u5F15\u304D\u51FA\u305B\u307E\u3059\u3002",
    "value.noRestrictions.title": "\u5236\u9650\u306A\u3057",
    "value.noRestrictions.desc":
      "\u3042\u306A\u305F\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\u3001\u3042\u306A\u305F\u306E\u30EB\u30FC\u30EB\u3002\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3092\u691C\u95B2\u3057\u307E\u305B\u3093\u3002",
    "showcase.title": "\u597D\u304D\u306B\u306A\u308B\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3092\u898B\u3064\u3051\u3088\u3046",
    "showcase.subtitle":
      "\u30D5\u30A3\u30C3\u30C8\u30CD\u30B9\u30B3\u30FC\u30C1\u3001\u30A2\u30FC\u30C6\u30A3\u30B9\u30C8\u3001\u30B7\u30A7\u30D5\u3001\u30A2\u30CA\u30EA\u30B9\u30C8\u306A\u3069\u3002",
    "showcase.seeAll": "\u5168\u3066\u306E\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3092\u898B\u308B",
    "cta.title": "\u81EA\u5206\u306E\u6761\u4EF6\u3067\u7A3C\u3050\u6E96\u5099\u306F\u3067\u304D\u307E\u3057\u305F\u304B\uFF1F",
    "cta.subtitle":
      "\u4F5C\u54C1\u3068\u53CE\u76CA\u3092\u5C0A\u91CD\u3059\u308B\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u3092\u9078\u3093\u3060\u6570\u5343\u4EBA\u306E\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u306B\u53C2\u52A0\u3057\u307E\u3057\u3087\u3046\u3002",
    "cta.button": "\u4ECA\u3059\u3050\u59CB\u3081\u308B",
    "dash.home": "\u30DB\u30FC\u30E0",
    "dash.explore": "\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC\u3092\u63A2\u3059",
    "dash.subscriptions": "\u30DE\u30A4\u30B5\u30D6\u30B9\u30AF\u30EA\u30D7\u30B7\u30E7\u30F3",
    "dash.bookmarks": "\u30D6\u30C3\u30AF\u30DE\u30FC\u30AF",
    "dash.posts": "\u6295\u7A3F\u4E00\u89A7",
    "dash.newPost": "\u65B0\u898F\u6295\u7A3F",
    "dash.messages": "\u30E1\u30C3\u30BB\u30FC\u30B8",
    "dash.subscribers": "\u8CFC\u8AAD\u8005",
    "dash.earnings": "\u53CE\u76CA",
    "dash.stories": "\u30B9\u30C8\u30FC\u30EA\u30FC",
    "dash.live": "\u30E9\u30A4\u30D6",
    "dash.aiStudio": "AI\u30B9\u30BF\u30B8\u30AA",
    "dash.aiChat": "AI\u30C1\u30E3\u30C3\u30C8",
    "dash.analytics": "\u30A2\u30CA\u30EA\u30C6\u30A3\u30AF\u30B9",
    "dash.wallet": "\u30A6\u30A9\u30EC\u30C3\u30C8",
    "dash.promotions": "\u30D7\u30ED\u30E2\u30FC\u30B7\u30E7\u30F3",
    "dash.affiliates": "\u30A2\u30D5\u30A3\u30EA\u30A8\u30A4\u30C8",
    "dash.referrals": "\u7D39\u4ECB",
    "dash.notifications": "\u901A\u77E5",
    "dash.verification": "\u672C\u4EBA\u78BA\u8A8D",
    "dash.settings": "\u8A2D\u5B9A",
    "dash.accountType": "\u30A2\u30AB\u30A6\u30F3\u30C8\u30BF\u30A4\u30D7",
    "dash.admin": "\u7BA1\u7406\u8005",
    "dash.creator": "\u30AF\u30EA\u30A8\u30A4\u30BF\u30FC",
    "dash.fan": "\u30D5\u30A1\u30F3",
    "dash.myProfile": "\u30DE\u30A4\u30D7\u30ED\u30D5\u30A3\u30FC\u30EB",
    "dash.signOut": "\u30ED\u30B0\u30A2\u30A6\u30C8",
    "common.loading": "\u8AAD\u307F\u8FBC\u307F\u4E2D...",
    "common.error": "\u554F\u984C\u304C\u767A\u751F\u3057\u307E\u3057\u305F",
    "common.retry": "\u518D\u8A66\u884C",
  },

  // -----------------------------------------------------------------------
  // Chinese (Simplified)
  // -----------------------------------------------------------------------
  zh: {
    "nav.home": "\u9996\u9875",
    "nav.explore": "\u63A2\u7D22",
    "nav.pricing": "\u4EF7\u683C",
    "nav.login": "\u767B\u5F55",
    "nav.signup": "\u6CE8\u518C",
    "nav.dashboard": "\u63A7\u5236\u53F0",
    "hero.title.line1": "\u521B\u4F5C\u8005\u5E73\u53F0",
    "hero.title.accent": "\u8D5A\u5F97\u66F4\u591A\u3002",
    "hero.subtitle":
      "\u5206\u4EAB\u72EC\u5BB6\u5185\u5BB9\uFF0C\u5EFA\u7ACB\u771F\u5B9E\u793E\u533A\uFF0C\u4FDD\u7559\u66F4\u591A\u6536\u5165\u3002\u7C89\u4E1D\u8BA2\u9605\u3002\u4F60\u83B7\u5F97\u62A5\u916C\u3002\u5C31\u8FD9\u4E48\u7B80\u5355\u3002",
    "hero.cta.earn": "\u4ECA\u5929\u5F00\u59CB\u8D5A\u94B1",
    "hero.cta.browse": "\u6D4F\u89C8\u521B\u4F5C\u8005",
    "social.creators": "\u521B\u4F5C\u8005",
    "social.earned": "\u672C\u6708\u6536\u5165",
    "social.subscribers": "\u8BA2\u9605\u8005",
    "value.keep95.title": "\u4FDD\u7559\u9AD895%",
    "value.keep95.desc":
      "\u6253\u8D4F\u548C\u8BA2\u9605\u4EC5\u65365%\u5E73\u53F0\u8D39\u3002\u884C\u4E1A\u6700\u4F4E\u3002",
    "value.instant.title": "\u5373\u65F6\u4ED8\u6B3E",
    "value.instant.desc": "\u65E07\u5929\u7B49\u5F85\u3002\u968F\u65F6\u63D0\u73B0\u3002",
    "value.noRestrictions.title": "\u65E0\u9650\u5236",
    "value.noRestrictions.desc":
      "\u4F60\u7684\u5185\u5BB9\uFF0C\u4F60\u7684\u89C4\u5219\u3002\u6211\u4EEC\u4E0D\u5BA1\u67E5\u521B\u4F5C\u8005\u3002",
    "showcase.title": "\u53D1\u73B0\u4F60\u4F1A\u559C\u6B22\u7684\u521B\u4F5C\u8005",
    "showcase.subtitle":
      "\u5065\u8EAB\u6559\u7EC3\u3001\u827A\u672F\u5BB6\u3001\u53A8\u5E08\u3001\u5206\u6790\u5E08\u7B49\u3002",
    "showcase.seeAll": "\u67E5\u770B\u6240\u6709\u521B\u4F5C\u8005",
    "cta.title": "\u51C6\u5907\u597D\u6309\u81EA\u5DF1\u7684\u6761\u4EF6\u8D5A\u94B1\u4E86\u5417\uFF1F",
    "cta.subtitle":
      "\u52A0\u5165\u6570\u5343\u540D\u9009\u62E9\u5C0A\u91CD\u4ED6\u4EEC\u5DE5\u4F5C\u548C\u94B1\u5305\u7684\u5E73\u53F0\u7684\u521B\u4F5C\u8005\u3002",
    "cta.button": "\u4ECA\u5929\u5F00\u59CB\u8D5A\u94B1",
    "dash.home": "\u9996\u9875",
    "dash.explore": "\u63A2\u7D22\u521B\u4F5C\u8005",
    "dash.subscriptions": "\u6211\u7684\u8BA2\u9605",
    "dash.bookmarks": "\u4E66\u7B7E",
    "dash.posts": "\u6211\u7684\u5E16\u5B50",
    "dash.newPost": "\u65B0\u5E16\u5B50",
    "dash.messages": "\u6D88\u606F",
    "dash.subscribers": "\u8BA2\u9605\u8005",
    "dash.earnings": "\u6536\u5165",
    "dash.stories": "\u52A8\u6001",
    "dash.live": "\u76F4\u64AD",
    "dash.aiStudio": "AI\u5DE5\u4F5C\u5BA4",
    "dash.aiChat": "AI\u804A\u5929",
    "dash.analytics": "\u6570\u636E\u5206\u6790",
    "dash.wallet": "\u94B1\u5305",
    "dash.promotions": "\u4FC3\u9500",
    "dash.affiliates": "\u8054\u76DF",
    "dash.referrals": "\u63A8\u8350",
    "dash.notifications": "\u901A\u77E5",
    "dash.verification": "\u8EAB\u4EFD\u9A8C\u8BC1",
    "dash.settings": "\u8BBE\u7F6E",
    "dash.accountType": "\u8D26\u6237\u7C7B\u578B",
    "dash.admin": "\u7BA1\u7406\u5458",
    "dash.creator": "\u521B\u4F5C\u8005",
    "dash.fan": "\u7C89\u4E1D",
    "dash.myProfile": "\u6211\u7684\u4E2A\u4EBA\u8D44\u6599",
    "dash.signOut": "\u9000\u51FA",
    "common.loading": "\u52A0\u8F7D\u4E2D...",
    "common.error": "\u51FA\u4E86\u70B9\u95EE\u9898",
    "common.retry": "\u91CD\u8BD5",
  },

  // -----------------------------------------------------------------------
  // Korean
  // -----------------------------------------------------------------------
  ko: {
    "nav.home": "\uD648",
    "nav.explore": "\uD0D0\uC0C9",
    "nav.pricing": "\uC694\uAE08",
    "nav.login": "\uB85C\uADF8\uC778",
    "nav.signup": "\uD68C\uC6D0\uAC00\uC785",
    "nav.dashboard": "\uB300\uC2DC\uBCF4\uB4DC",
    "hero.title.line1": "\uD06C\uB9AC\uC5D0\uC774\uD130 \uD50C\uB7AB\uD3FC",
    "hero.title.accent": "\uB354 \uB9CE\uC774 \uBC88\uB2E4.",
    "hero.subtitle":
      "\uB3C5\uC810 \uCF58\uD150\uCE20\uB97C \uACF5\uC720\uD558\uACE0, \uC9C4\uC815\uD55C \uCEE4\uBBA4\uB2C8\uD2F0\uB97C \uAD6C\uCD95\uD558\uACE0, \uC218\uC775\uC744 \uB354 \uB9CE\uC774 \uAC00\uC838\uAC00\uC138\uC694. \uD33C\uC774 \uAD6C\uB3C5\uD558\uACE0. \uB2F9\uC2E0\uC774 \uBC1B\uC2B5\uB2C8\uB2E4. \uAC04\uB2E8\uD569\uB2C8\uB2E4.",
    "hero.cta.earn": "\uC624\uB298 \uC218\uC775 \uC2DC\uC791\uD558\uAE30",
    "hero.cta.browse": "\uD06C\uB9AC\uC5D0\uC774\uD130 \uCC3E\uC544\uBCF4\uAE30",
    "social.creators": "\uD06C\uB9AC\uC5D0\uC774\uD130",
    "social.earned": "\uC774\uBC88 \uB2EC \uC218\uC775",
    "social.subscribers": "\uAD6C\uB3C5\uC790",
    "value.keep95.title": "\uCD5C\uB300 95% \uC720\uC9C0",
    "value.keep95.desc":
      "\uD301\uACFC \uAD6C\uB3C5\uC5D0 \uB2E8 5% \uC218\uC218\uB8CC. \uC5C5\uACC4 \uCD5C\uC800.",
    "value.instant.title": "\uC989\uC2DC \uC9C0\uAE09",
    "value.instant.desc":
      "7\uC77C \uB300\uAE30 \uC5C6\uC74C. \uC6D0\uD560 \uB54C \uC778\uCD9C.",
    "value.noRestrictions.title": "\uC81C\uD55C \uC5C6\uC74C",
    "value.noRestrictions.desc":
      "\uB2F9\uC2E0\uC758 \uCF58\uD150\uCE20, \uB2F9\uC2E0\uC758 \uADDC\uCE59. \uD06C\uB9AC\uC5D0\uC774\uD130\uB97C \uAC80\uC5F4\uD558\uC9C0 \uC54A\uC2B5\uB2C8\uB2E4.",
    "showcase.title": "\uC88B\uC544\uD560 \uD06C\uB9AC\uC5D0\uC774\uD130\uB97C \uBC1C\uACAC\uD558\uC138\uC694",
    "showcase.subtitle":
      "\uD53C\uD2B8\uB2C8\uC2A4 \uCF54\uCE58, \uC544\uD2F0\uC2A4\uD2B8, \uC170\uD504, \uBD84\uC11D\uAC00 \uB4F1.",
    "showcase.seeAll": "\uBAA8\uB4E0 \uD06C\uB9AC\uC5D0\uC774\uD130 \uBCF4\uAE30",
    "cta.title": "\uB2F9\uC2E0\uC758 \uC870\uAC74\uC73C\uB85C \uBC88 \uC900\uBE44\uAC00 \uB418\uC168\uB098\uC694?",
    "cta.subtitle":
      "\uC791\uC5C5\uACFC \uC218\uC775\uC744 \uC874\uC911\uD558\uB294 \uD50C\uB7AB\uD3FC\uC744 \uC120\uD0DD\uD55C \uC218\uCC9C \uBA85\uC758 \uD06C\uB9AC\uC5D0\uC774\uD130\uC640 \uD568\uAED8\uD558\uC138\uC694.",
    "cta.button": "\uC624\uB298 \uC218\uC775 \uC2DC\uC791\uD558\uAE30",
    "dash.home": "\uD648",
    "dash.explore": "\uD06C\uB9AC\uC5D0\uC774\uD130 \uD0D0\uC0C9",
    "dash.subscriptions": "\uB0B4 \uAD6C\uB3C5",
    "dash.bookmarks": "\uBD81\uB9C8\uD06C",
    "dash.posts": "\uB0B4 \uAC8C\uC2DC\uBB3C",
    "dash.newPost": "\uC0C8 \uAC8C\uC2DC\uBB3C",
    "dash.messages": "\uBA54\uC2DC\uC9C0",
    "dash.subscribers": "\uAD6C\uB3C5\uC790",
    "dash.earnings": "\uC218\uC775",
    "dash.stories": "\uC2A4\uD1A0\uB9AC",
    "dash.live": "\uB77C\uC774\uBE0C",
    "dash.aiStudio": "AI \uC2A4\uD29C\uB514\uC624",
    "dash.aiChat": "AI \uCC44\uD305",
    "dash.analytics": "\uBD84\uC11D",
    "dash.wallet": "\uC9C0\uAC11",
    "dash.promotions": "\uD504\uB85C\uBAA8\uC158",
    "dash.affiliates": "\uC81C\uD734",
    "dash.referrals": "\uCD94\uCC9C",
    "dash.notifications": "\uC54C\uB9BC",
    "dash.verification": "\uBCF8\uC778\uC778\uC99D",
    "dash.settings": "\uC124\uC815",
    "dash.accountType": "\uACC4\uC815 \uC720\uD615",
    "dash.admin": "\uAD00\uB9AC\uC790",
    "dash.creator": "\uD06C\uB9AC\uC5D0\uC774\uD130",
    "dash.fan": "\uD33C",
    "dash.myProfile": "\uB0B4 \uD504\uB85C\uD544",
    "dash.signOut": "\uB85C\uADF8\uC544\uC6C3",
    "common.loading": "\uB85C\uB529 \uC911...",
    "common.error": "\uBB38\uC81C\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4",
    "common.retry": "\uB2E4\uC2DC \uC2DC\uB3C4",
  },

  // -----------------------------------------------------------------------
  // Arabic
  // -----------------------------------------------------------------------
  ar: {
    "nav.home": "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    "nav.explore": "\u0627\u0633\u062A\u0643\u0634\u0641",
    "nav.pricing": "\u0627\u0644\u0623\u0633\u0639\u0627\u0631",
    "nav.login": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062F\u062E\u0648\u0644",
    "nav.signup": "\u0625\u0646\u0634\u0627\u0621 \u062D\u0633\u0627\u0628",
    "nav.dashboard": "\u0644\u0648\u062D\u0629 \u0627\u0644\u062A\u062D\u0643\u0645",
    "hero.title.line1": "\u0645\u0646\u0635\u0629 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646",
    "hero.title.accent": "\u0627\u0644\u062A\u064A \u062A\u062F\u0641\u0639 \u0623\u0643\u062B\u0631.",
    "hero.subtitle":
      "\u0634\u0627\u0631\u0643 \u0645\u062D\u062A\u0648\u0649 \u062D\u0635\u0631\u064A\u060C \u0627\u0628\u0646\u0650 \u0645\u062C\u062A\u0645\u0639\u0627\u064B \u062D\u0642\u064A\u0642\u064A\u0627\u064B\u060C \u0648\u0627\u062D\u062A\u0641\u0638 \u0628\u0627\u0644\u0645\u0632\u064A\u062F \u0645\u0645\u0627 \u062A\u0643\u0633\u0628. \u0627\u0644\u0645\u0639\u062C\u0628\u0648\u0646 \u064A\u0634\u062A\u0631\u0643\u0648\u0646. \u0623\u0646\u062A \u062A\u062D\u0635\u0644 \u0639\u0644\u0649 \u0627\u0644\u0645\u0627\u0644. \u0628\u0633\u064A\u0637.",
    "hero.cta.earn": "\u0627\u0628\u062F\u0623 \u0627\u0644\u0631\u0628\u062D \u0627\u0644\u064A\u0648\u0645",
    "hero.cta.browse": "\u062A\u0635\u0641\u062D \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646",
    "social.creators": "\u0645\u0628\u062F\u0639",
    "social.earned": "\u0631\u0628\u062D \u0647\u0630\u0627 \u0627\u0644\u0634\u0647\u0631",
    "social.subscribers": "\u0645\u0634\u062A\u0631\u0643",
    "value.keep95.title": "\u0627\u062D\u062A\u0641\u0638 \u0628\u0640 95%",
    "value.keep95.desc":
      "\u0641\u0642\u0637 5% \u0631\u0633\u0648\u0645 \u0639\u0644\u0649 \u0627\u0644\u0625\u0643\u0631\u0627\u0645\u064A\u0627\u062A \u0648\u0627\u0644\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A. \u0627\u0644\u0623\u0642\u0644 \u0641\u064A \u0627\u0644\u0635\u0646\u0627\u0639\u0629.",
    "value.instant.title": "\u062F\u0641\u0639 \u0641\u0648\u0631\u064A",
    "value.instant.desc":
      "\u0628\u062F\u0648\u0646 \u0627\u0646\u062A\u0638\u0627\u0631 7 \u0623\u064A\u0627\u0645. \u0627\u0633\u062D\u0628 \u0645\u062A\u0649 \u0634\u0626\u062A.",
    "value.noRestrictions.title": "\u0628\u062F\u0648\u0646 \u0642\u064A\u0648\u062F",
    "value.noRestrictions.desc":
      "\u0645\u062D\u062A\u0648\u0627\u0643\u060C \u0642\u0648\u0627\u0639\u062F\u0643. \u0646\u062D\u0646 \u0644\u0627 \u0646\u0631\u0627\u0642\u0628 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646.",
    "showcase.title": "\u0627\u0643\u062A\u0634\u0641 \u0645\u0628\u062F\u0639\u064A\u0646 \u0633\u062A\u062D\u0628\u0647\u0645",
    "showcase.subtitle":
      "\u0645\u062F\u0631\u0628\u0648 \u0644\u064A\u0627\u0642\u0629\u060C \u0641\u0646\u0627\u0646\u0648\u0646\u060C \u0637\u0647\u0627\u0629\u060C \u0645\u062D\u0644\u0644\u0648\u0646 \u0648\u0627\u0644\u0645\u0632\u064A\u062F.",
    "showcase.seeAll": "\u0639\u0631\u0636 \u062C\u0645\u064A\u0639 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646",
    "cta.title": "\u0645\u0633\u062A\u0639\u062F \u0644\u0644\u0631\u0628\u062D \u0628\u0634\u0631\u0648\u0637\u0643\u061F",
    "cta.subtitle":
      "\u0627\u0646\u0636\u0645 \u0625\u0644\u0649 \u0622\u0644\u0627\u0641 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646 \u0627\u0644\u0630\u064A\u0646 \u0627\u062E\u062A\u0627\u0631\u0648\u0627 \u0645\u0646\u0635\u0629 \u062A\u062D\u062A\u0631\u0645 \u0639\u0645\u0644\u0647\u0645 \u0648\u0645\u062D\u0641\u0638\u062A\u0647\u0645.",
    "cta.button": "\u0627\u0628\u062F\u0623 \u0627\u0644\u0631\u0628\u062D \u0627\u0644\u064A\u0648\u0645",
    "dash.home": "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
    "dash.explore": "\u0627\u0633\u062A\u0643\u0634\u0641 \u0627\u0644\u0645\u0628\u062F\u0639\u064A\u0646",
    "dash.subscriptions": "\u0627\u0634\u062A\u0631\u0627\u0643\u0627\u062A\u064A",
    "dash.bookmarks": "\u0627\u0644\u0645\u0641\u0636\u0644\u0627\u062A",
    "dash.posts": "\u0645\u0646\u0634\u0648\u0631\u0627\u062A\u064A",
    "dash.newPost": "\u0645\u0646\u0634\u0648\u0631 \u062C\u062F\u064A\u062F",
    "dash.messages": "\u0627\u0644\u0631\u0633\u0627\u0626\u0644",
    "dash.subscribers": "\u0627\u0644\u0645\u0634\u062A\u0631\u0643\u0648\u0646",
    "dash.earnings": "\u0627\u0644\u0623\u0631\u0628\u0627\u062D",
    "dash.stories": "\u0627\u0644\u0642\u0635\u0635",
    "dash.live": "\u0645\u0628\u0627\u0634\u0631",
    "dash.aiStudio": "\u0627\u0633\u062A\u0648\u062F\u064A\u0648 \u0627\u0644\u0630\u0643\u0627\u0621",
    "dash.aiChat": "\u062F\u0631\u062F\u0634\u0629 \u0627\u0644\u0630\u0643\u0627\u0621",
    "dash.analytics": "\u0627\u0644\u062A\u062D\u0644\u064A\u0644\u0627\u062A",
    "dash.wallet": "\u0627\u0644\u0645\u062D\u0641\u0638\u0629",
    "dash.promotions": "\u0627\u0644\u0639\u0631\u0648\u0636",
    "dash.affiliates": "\u0627\u0644\u062A\u0633\u0648\u064A\u0642 \u0628\u0627\u0644\u0639\u0645\u0648\u0644\u0629",
    "dash.referrals": "\u0627\u0644\u0625\u062D\u0627\u0644\u0627\u062A",
    "dash.notifications": "\u0627\u0644\u0625\u0634\u0639\u0627\u0631\u0627\u062A",
    "dash.verification": "\u0627\u0644\u062A\u062D\u0642\u0642",
    "dash.settings": "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
    "dash.accountType": "\u0646\u0648\u0639 \u0627\u0644\u062D\u0633\u0627\u0628",
    "dash.admin": "\u0645\u0633\u0624\u0648\u0644",
    "dash.creator": "\u0645\u0628\u062F\u0639",
    "dash.fan": "\u0645\u0639\u062C\u0628",
    "dash.myProfile": "\u0645\u0644\u0641\u064A \u0627\u0644\u0634\u062E\u0635\u064A",
    "dash.signOut": "\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C",
    "common.loading": "\u062C\u0627\u0631\u064D \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
    "common.error": "\u062D\u062F\u062B \u062E\u0637\u0623 \u0645\u0627",
    "common.retry": "\u062D\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062E\u0631\u0649",
  },

  // -----------------------------------------------------------------------
  // Russian
  // -----------------------------------------------------------------------
  ru: {
    "nav.home": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F",
    "nav.explore": "\u041E\u0431\u0437\u043E\u0440",
    "nav.pricing": "\u0426\u0435\u043D\u044B",
    "nav.login": "\u0412\u043E\u0439\u0442\u0438",
    "nav.signup": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F",
    "nav.dashboard": "\u041F\u0430\u043D\u0435\u043B\u044C",
    "hero.title.line1": "\u041F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430 \u0434\u043B\u044F \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432",
    "hero.title.accent": "\u043A\u043E\u0442\u043E\u0440\u0430\u044F \u043F\u043B\u0430\u0442\u0438\u0442 \u0431\u043E\u043B\u044C\u0448\u0435.",
    "hero.subtitle":
      "\u0414\u0435\u043B\u0438\u0442\u0435\u0441\u044C \u044D\u043A\u0441\u043A\u043B\u044E\u0437\u0438\u0432\u043D\u044B\u043C \u043A\u043E\u043D\u0442\u0435\u043D\u0442\u043E\u043C, \u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0435 \u0441\u043E\u043E\u0431\u0449\u0435\u0441\u0442\u0432\u043E \u0438 \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u0439\u0442\u0435 \u0431\u043E\u043B\u044C\u0448\u0435. \u0424\u0430\u043D\u0430\u0442\u044B \u043F\u043E\u0434\u043F\u0438\u0441\u044B\u0432\u0430\u044E\u0442\u0441\u044F. \u0412\u044B \u043F\u043E\u043B\u0443\u0447\u0430\u0435\u0442\u0435 \u0434\u0435\u043D\u044C\u0433\u0438. \u041F\u0440\u043E\u0441\u0442\u043E.",
    "hero.cta.earn": "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0437\u0430\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
    "hero.cta.browse": "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432",
    "social.creators": "\u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432",
    "social.earned": "\u0437\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u043D\u043E \u0432 \u044D\u0442\u043E\u043C \u043C\u0435\u0441\u044F\u0446\u0435",
    "social.subscribers": "\u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u043E\u0432",
    "value.keep95.title": "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0439\u0442\u0435 \u0434\u043E 95%",
    "value.keep95.desc":
      "\u0412\u0441\u0435\u0433\u043E 5% \u043A\u043E\u043C\u0438\u0441\u0441\u0438\u0438 \u0437\u0430 \u0447\u0430\u0435\u0432\u044B\u0435 \u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438. \u0421\u0430\u043C\u0430\u044F \u043D\u0438\u0437\u043A\u0430\u044F \u0432 \u0438\u043D\u0434\u0443\u0441\u0442\u0440\u0438\u0438.",
    "value.instant.title": "\u041C\u0433\u043D\u043E\u0432\u0435\u043D\u043D\u0430\u044F \u043E\u043F\u043B\u0430\u0442\u0430",
    "value.instant.desc":
      "\u0411\u0435\u0437 7-\u0434\u043D\u0435\u0432\u043D\u043E\u0439 \u0437\u0430\u0434\u0435\u0440\u0436\u043A\u0438. \u0412\u044B\u0432\u043E\u0434\u0438\u0442\u0435 \u043A\u043E\u0433\u0434\u0430 \u0445\u043E\u0442\u0438\u0442\u0435.",
    "value.noRestrictions.title": "\u0411\u0435\u0437 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u0439",
    "value.noRestrictions.desc":
      "\u0412\u0430\u0448 \u043A\u043E\u043D\u0442\u0435\u043D\u0442, \u0432\u0430\u0448\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u0430. \u041C\u044B \u043D\u0435 \u0446\u0435\u043D\u0437\u0443\u0440\u0438\u0440\u0443\u0435\u043C \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432.",
    "showcase.title": "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043F\u043E\u043B\u044E\u0431\u0438\u0442\u0435",
    "showcase.subtitle":
      "\u0424\u0438\u0442\u043D\u0435\u0441-\u0442\u0440\u0435\u043D\u0435\u0440\u044B, \u0445\u0443\u0434\u043E\u0436\u043D\u0438\u043A\u0438, \u043F\u043E\u0432\u0430\u0440\u0430, \u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0438 \u0438 \u043D\u0435 \u0442\u043E\u043B\u044C\u043A\u043E.",
    "showcase.seeAll": "\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C \u0432\u0441\u0435\u0445 \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432",
    "cta.title": "\u0413\u043E\u0442\u043E\u0432\u044B \u0437\u0430\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u043D\u0430 \u0441\u0432\u043E\u0438\u0445 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u0445?",
    "cta.subtitle":
      "\u041F\u0440\u0438\u0441\u043E\u0435\u0434\u0438\u043D\u044F\u0439\u0442\u0435\u0441\u044C \u043A \u0442\u044B\u0441\u044F\u0447\u0430\u043C \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u044B\u0431\u0440\u0430\u043B\u0438 \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0443, \u0443\u0432\u0430\u0436\u0430\u044E\u0449\u0443\u044E \u0438\u0445 \u0442\u0440\u0443\u0434 \u0438 \u043A\u043E\u0448\u0435\u043B\u0435\u043A.",
    "cta.button": "\u041D\u0430\u0447\u043D\u0438\u0442\u0435 \u0437\u0430\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u0441\u0435\u0433\u043E\u0434\u043D\u044F",
    "dash.home": "\u0413\u043B\u0430\u0432\u043D\u0430\u044F",
    "dash.explore": "\u041E\u0431\u0437\u043E\u0440 \u043A\u0440\u0438\u044D\u0439\u0442\u043E\u0440\u043E\u0432",
    "dash.subscriptions": "\u041C\u043E\u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0438",
    "dash.bookmarks": "\u0417\u0430\u043A\u043B\u0430\u0434\u043A\u0438",
    "dash.posts": "\u041C\u043E\u0438 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438",
    "dash.newPost": "\u041D\u043E\u0432\u0430\u044F \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F",
    "dash.messages": "\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u044F",
    "dash.subscribers": "\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0438",
    "dash.earnings": "\u0414\u043E\u0445\u043E\u0434",
    "dash.stories": "\u0418\u0441\u0442\u043E\u0440\u0438\u0438",
    "dash.live": "\u041F\u0440\u044F\u043C\u043E\u0439 \u044D\u0444\u0438\u0440",
    "dash.aiStudio": "AI \u0421\u0442\u0443\u0434\u0438\u044F",
    "dash.aiChat": "AI \u0427\u0430\u0442",
    "dash.analytics": "\u0410\u043D\u0430\u043B\u0438\u0442\u0438\u043A\u0430",
    "dash.wallet": "\u041A\u043E\u0448\u0435\u043B\u0435\u043A",
    "dash.promotions": "\u0410\u043A\u0446\u0438\u0438",
    "dash.affiliates": "\u041F\u0430\u0440\u0442\u043D\u0435\u0440\u044B",
    "dash.referrals": "\u0420\u0435\u0444\u0435\u0440\u0430\u043B\u044B",
    "dash.notifications": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F",
    "dash.verification": "\u0412\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u044F",
    "dash.settings": "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438",
    "dash.accountType": "\u0422\u0438\u043F \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430",
    "dash.admin": "\u0410\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440",
    "dash.creator": "\u041A\u0440\u0438\u044D\u0439\u0442\u043E\u0440",
    "dash.fan": "\u0424\u0430\u043D\u0430\u0442",
    "dash.myProfile": "\u041C\u043E\u0439 \u043F\u0440\u043E\u0444\u0438\u043B\u044C",
    "dash.signOut": "\u0412\u044B\u0439\u0442\u0438",
    "common.loading": "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...",
    "common.error": "\u0427\u0442\u043E-\u0442\u043E \u043F\u043E\u0448\u043B\u043E \u043D\u0435 \u0442\u0430\u043A",
    "common.retry": "\u041F\u043E\u043F\u0440\u043E\u0431\u043E\u0432\u0430\u0442\u044C \u0441\u043D\u043E\u0432\u0430",
  },
};

export default translations;
