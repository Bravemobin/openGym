import { getLang, t } from '../lib/i18n.js'

export const ADMIN_FA = {
  // General & Headers
  'Admin': 'مدیریت',
  'Management Dashboard': 'داشبورد مدیریت',
  'Admin Access Required': 'دسترسی مدیر الزامی است',
  'Operator Access Only': 'فقط دسترسی اپراتور',
  'Loading…': 'در حال بارگذاری…',
  'Could not load': 'امکان بارگذاری وجود نداشت',
  'The last update failed': 'آخرین به‌روزرسانی ناموفق بود',
  'Could not load the users': 'امکان بارگذاری کاربران وجود نداشت',
  'Try again': 'تلاش مجدد',
  'The list below is the last one that loaded.': 'لیست زیر آخرین اطلاعاتی است که با موفقیت بارگذاری شده بود.',
  'It tries again every 15 seconds.': 'هر ۱۵ ثانیه دوباره تلاش می‌شود.',
  'Management dashboard for this gym instance: monitor live workouts on floor, recognize member activity and streaks, explore attendance analytics, and manage member profiles.': 'داشبورد مدیریتی این باشگاه: نظارت بر تمرینات زنده در سالن، بررسی فعالیت و تداوم اعضا، تحلیل آمار حضور، و مدیریت نمایه‌های کاربران.',
  'Back': 'بازگشت',
  'Done': 'انجام شد',
  'Copied': 'کپی شد',
  'Copy': 'کپی',
  'Clear': 'پاک کردن',
  'Delete': 'حذف',
  'Disable': 'غیرفعال‌سازی',
  'Continue': 'ادامه',
  'Revoke': 'لغو',
  'Show more': 'نمایش بیشتر',
  'All': 'همه',
  'Live': 'زنده',
  'failed': 'ناموفق',
  'admin': 'مدیر',
  'disabled': 'غیرفعال',
  'password': 'رمز عبور',
  'training now': 'در حال تمرین',
  'never': 'هرگز',
  'just now': 'همین الان',
  'session': 'جلسه',
  'sessions': 'جلسه',
  'active': 'فعال',
  'Today': 'امروز',
  'workout': 'تمرین',
  'workouts': 'تمرین',
  'users': 'کاربر',
  'active this week': 'فعال در این هفته',

  // Tabs & KPIs
  'Activity Feed': 'فید فعالیت',
  'Analytics': 'آمار و تحلیل',
  'Music & Audio': 'موزیک و صدا',
  'Operations': 'عملیات',
  'Users': 'کاربران',
  'Live on Floor': 'زنده در سالن',
  'Live on Gym Floor': 'زنده در سالن باشگاه',
  'Live now': 'اکنون آنلاین',
  'Active 7d': 'فعال در ۷ روز',
  'Workouts': 'تمرین‌ها',
  'Weigh-ins': 'ثبت وزن',
  'Routines': 'برنامه‌ها',
  'Last sync': 'آخرین همگام‌سازی',
  'DAU / WAU': 'کاربران روزانه / هفتگی (DAU / WAU)',
  'This Month': 'این ماه',
  'Avg Duration': 'میانگین مدت',
  'Gym Volume': 'حجم تمرین باشگاه',
  'Attendance & Activity Trends': 'روند حضور و فعالیت‌ها',
  'Recognize member volume, daily workout consistency, and training patterns over time.': 'بررسی حجم تمرینات اعضا، تداوم تمرینات روزانه و الگوهای تمرینی در طول زمان.',

  // Live Floor & Feed
  'Gym Floor is Quiet': 'سالن باشگاه خلوت است',
  'No active training sessions recorded right now.': 'در حال حاضر هیچ جلسه تمرینی فعالی ثبت نشده است.',
  'Sessions running at this moment. Tap a name for details.': 'جلسات در حال انجام در این لحظه. برای مشاهده جزئیات روی نام ضربه بزنید.',
  'Workout Activity Feed': 'فید فعالیت‌های تمرینی',
  'recent sessions': 'جلسه اخیر',
  'Recent workout sessions completed by all members.': 'جلسات تمرینی اخیر تکمیل‌شده توسط تمام اعضا.',
  'Chronological stream of workouts completed across the gym. Tap any workout for member history.': 'جریان زمانی تمرین‌های انجام‌شده در باشگاه. برای سابقه عضو روی هر تمرین ضربه بزنید.',
  'Filter feed by member or workout name...': 'فیلتر فید بر اساس نام عضو یا نام تمرین...',
  'finished': 'به پایان رساند:',
  'Recently': 'اخیراً',
  'No workouts logged yet.': 'هنوز تمرینی ثبت نشده است.',
  'No workouts matching your filter.': 'هیچ تمرینی مطابق با فیلتر شما یافت نشد.',
  'No workouts logged.': 'هیچ تمرینی ثبت نشده است.',
  'Workout history': 'سابقه تمرینات',

  // Members / Users
  'Everyone with a profile on this instance. Tap one to see their activity, to disable the account (nothing is deleted) or to delete it with all their data for good.': 'همه افرادی که در این سرور نمایه دارند. برای دیدن فعالیت، غیرفعال کردن حساب (چیزی حذف نمی‌شود) یا حذف دائمی با تمام داده‌ها ضربه بزنید.',
  'Search member by name or email...': 'جستجوی عضو بر اساس نام یا ایمیل...',
  'Active this week': 'فعال در این هفته',
  'Disabled': 'غیرفعال',
  'No users yet.': 'هنوز کاربری وجود ندارد.',
  'Disable account': 'غیرفعال‌سازی حساب',
  'Enable account': 'فعال‌سازی حساب',
  'Enabling lets them sign in and sync again.': 'فعال‌سازی به آن‌ها اجازه می‌دهد دوباره وارد شده و همگام‌سازی کنند.',
  'Disabling signs them out everywhere and blocks sign-in. Nothing is deleted.': 'غیرفعال‌سازی آن‌ها را از همه جا خارج کرده و ورود را مسدود می‌کند. هیچ داده‌ای حذف نمی‌شود.',
  'Delete account': 'حذف حساب کاربری',
  'Download their data': 'دانلود داده‌های کاربر',
  'Deleting removes the account and every trace of its training history from this server.': 'حذف کردن، حساب و تمامی ردپاهای سابقه تمرینی آن را از این سرور پاک می‌کند.',
  'Reset password': 'بازنشانی رمز عبور',
  'For a forgotten password: a one-time code lets them choose a new one. Their current password stops working at once.': 'برای رمز عبور فراموش‌شده: یک کد یک‌بار مصرف به آن‌ها اجازه می‌دهد رمز جدیدی انتخاب کنند. رمز فعلی آن‌ها بلافاصله از کار می‌افتد.',
  'No password yet. A one-time code lets them set one — the way back in after losing their only passkey.': 'هنوز رمزی ثبت نشده است. یک کد یک‌بار مصرف به آن‌ها اجازه می‌دهد رمزی تنظیم کنند — راه بازگشت پس از گم کردن تنها کلید عبور.',
  'Account deleted': 'حساب کاربری حذف شد',
  'User disabled': 'کاربر غیرفعال شد',
  'User enabled': 'کاربر فعال شد',

  // Reset code & Dialogs
  'Create reset code': 'ایجاد کد بازنشانی',
  'They are signed out everywhere and can no longer sync or log in until re-enabled. Their data stays.': 'آن‌ها از همه جا خارج می‌شوند و تا زمانی که مجدداً فعال نشوند نمی‌توانند همگام‌سازی یا وارد شوند. داده‌های آن‌ها باقی می‌ماند.',
  'Everything goes: their workouts, weigh-ins, routines, passkeys and notifications. This cannot be undone, and the invite code they joined with stays used. Download their data first if they might want it.': 'همه چیز پاک می‌شود: تمرین‌ها، وزن‌ها، برنامه‌ها، کلیدهای عبور و اعلان‌ها. این عملیات قابل بازگشت نیست و کد دعوتی که با آن وارد شده‌اند همچنان استفاده‌شده باقی می‌ماند. اگر ممکن است داده‌هایشان را بخواهند، ابتدا آن را دانلود کنید.',
  'Last chance — there is no undo and no backup of this on the server.': 'آخرین فرصت — هیچ بازگشت یا نسخه پشتیبانی از این داده در سرور وجود ندارد.',

  // Invites & Audit
  'Invite codes': 'کدهای دعوت',
  'New code': 'کد جدید',
  'Sign-up is invite-only: someone needs one of these codes to create a profile. Each code works once.': 'ثبت‌نام فقط با دعوت است: برای ایجاد نمایه به یکی از این کدها نیاز است. هر کد یک بار کار می‌کند.',
  'Sign-up is open, so codes are optional here — they only record who invited whom.': 'ثبت‌نام باز است، بنابراین کدها اختیاری هستند — فقط ثبت می‌کنند چه کسی چه کسی را دعوت کرده است.',
  'Unused · tap to copy': 'استفاده نشده · برای کپی ضربه بزنید',
  'Already used': 'قبلاً استفاده شده',
  'used': 'استفاده شده',
  'No codes yet. "New code" makes one and copies it to your clipboard.': 'هنوز کدی وجود ندارد. «کد جدید» یک کد می‌سازد و در کلیپ‌بورد شما کپی می‌کند.',
  'Anyone who has it can no longer use it. People who already signed up with it are not affected.': 'هر کسی این کد را داشته باشد دیگر نمی‌تواند از آن استفاده کند. افرادی که قبلاً با آن ثبت‌نام کرده‌اند تحت تأثیر قرار نمی‌گیرند.',
  'Code revoked': 'کد لغو شد',
  'Activity log': 'گزارش فعالیت‌ها',
  'Clear the activity log?': 'پاک کردن گزارش فعالیت‌ها؟',
  'Every recorded event is deleted. The clear itself is logged, so the gap stays visible.': 'تمام رویدادهای ثبت‌شده حذف می‌شوند. خود عمل پاک‌سازی نیز ثبت می‌شود، بنابراین فاصله زمانی مشخص خواهد بود.',
  'Activity log cleared': 'گزارش فعالیت‌ها پاک شد',
  'Who signed in, what failed, and what an admin changed.': 'چه کسی وارد شده، چه مواردی ناموفق بوده و مدیر چه تغییراتی اعمال کرده است.',
  'Sign-ins': 'ورودها',
  'Failed': 'ناموفق',
  'Nothing logged yet.': 'هنوز چیزی ثبت نشده است.',

  // Charts & Leaderboard
  'Daily Workouts (Last 30 Days)': 'تمرین‌های روزانه (۳۰ روز گذشته)',
  'Peak Gym Days (All Time)': 'روزهای اوج باشگاه (کل دوران)',
  'Peak Training Hours (24h)': 'ساعات اوج تمرین (۲۴ ساعته)',
  'Gym Attendance Heatmap (Past Year)': 'نقشه حرارتی حضور در باشگاه (سال گذشته)',
  'Consistency Leaderboard': 'جدول برترین‌های تداوم',
  'Top Active Members': 'فعال‌ترین اعضا',
  'Recognizing member dedication, weekly streaks, and total training volume.': 'تقدیر از تعهد اعضا، تداوم‌های هفتگی و کل حجم تمرینات.',

  // Access Required Screen
  'You are currently using openGym in guest mode or not signed in. An admin profile is needed to manage live gym data.': 'شما در حال حاضر در حالت مهمان هستید یا وارد نشده‌اید. برای مدیریت داده‌های زنده باشگاه به نمایه مدیر نیاز است.',
  'YOUR USER ID:': 'شناسه کاربری شما:',
  'User ID copied': 'شناسه کاربری کپی شد',
  'How to enable admin access:': 'نحوه فعال‌سازی دسترسی مدیریت:',
  'Preview Management Dashboard (Demo Mode)': 'پیش‌نمایش داشبورد مدیریت (حالت آزمایشی)',

  // AI Coach
  'AI Coach': 'مربی هوش مصنوعی',
  'Loading Coach status…': 'در حال بارگذاری وضعیت مربی…',
  'Off — users see no Coach anywhere in the app.': 'خاموش — کاربران در هیچ کجای برنامه مربی را نمی‌بینند.',
  'On, but no endpoint yet — finish step 2.': 'روشن، اما هنوز پایانه مشخص نشده است — مرحله ۲ را تکمیل کنید.',
  'On, but no credential yet — finish the Credential step.': 'روشن، اما هنوز اطلاعات هویتی وارد نشده است — مرحله اعتبار را تکمیل کنید.',
  'On, but the provider cannot be reached — see the Test step.': 'روشن، اما ارائه‌دهنده در دسترس نیست — مرحله آزمایش را بررسی کنید.',
  'On': 'روشن',
  'ready': 'آماده',
  'not ready': 'آماده نیست',
  'Users find the Coach under Plan → Coach. This switch is the only place it can be turned off for everyone.': 'کاربران مربی را در برنامه ← مربی پیدا می‌کنند. این کلید تنها جایی است که می‌توان آن را برای همه خاموش کرد.',
  'Paste an API key': 'چسباندن کلید API',
  'Plain HTTPS to the provider. Works on the default api image — nothing extra to install.': 'ارتباط مستقیم HTTPS با ارائه‌دهنده. روی ایمیج پیش‌فرض کار می‌کند — نیازی به نصب موارد اضافی نیست.',
  'Runs a local AI runtime': 'اجرای محیط هوش مصنوعی محلی',
  'Needs the bigger api image built with --target coach.': 'به ایمیج بزرگتر ساخته‌شده با پرچم coach-- نیاز دارد.',
  'Testing': 'تست و آزمایش',
  'A built-in fake that answers instantly, so the whole loop can be tried without an account.': 'یک مدل ساختگی پیش‌فرض که فوراً پاسخ می‌دهد تا بتوان کل فرآیند را بدون داشتن حساب کاربری آزمایش کرد.',
  'An optional coach that designs training plans and reviews what people actually log. Off right now — nobody sees it anywhere in the app.': 'یک مربی اختیاری که برنامه‌های تمرینی طراحی کرده و تمرینات ثبت‌شده کاربران را بررسی می‌کند. در حال حاضر خاموش است — هیچ کاربری آن را نمی‌بیند.',
  'Bring any AI.': 'هر نوع هوش مصنوعی را متصل کنید.',
  'An API key from Anthropic, OpenAI or Gemini — or a free local model via Ollama.': 'کلید API از Anthropic، OpenAI یا Gemini — یا یک مدل محلی رایگان از طریق Ollama.',
  'Private by design.': 'حریم خصوصی تضمین‌شده.',
  'A strict allowlist decides what leaves; every change needs the user\'s yes and can be undone.': 'یک لیست مجاز سخت‌گیرانه مشخص می‌کند چه داده‌هایی ارسال شوند؛ هر تغییری نیازمند تأیید کاربر بوده و قابل بازگشت است.',
  'Each user decides.': 'تصمیم‌گیری با هر کاربر است.',
  'Turning it on only makes the Coach available; every person consents for themselves.': 'روشن کردن آن فقط مربی را در دسترس قرار می‌دهد؛ هر کاربر شخصاً رضایت خود را اعلام می‌کند.',
  'Set up the Coach': 'راه‌اندازی مربی',
  'Provider': 'ارائه‌دهنده',
  'Which AI answers the Coach': 'کدام هوش مصنوعی به مربی پاسخ می‌دهد',
  'Pick who answers. A key or token you save stays with its provider, so you can switch back and forth without pasting it again.': 'انتخاب کنید چه کسی پاسخ دهد. کلید یا توکنی که ذخیره می‌کنید نزد ارائه‌دهنده خود می‌ماند، بنابراین می‌توانید بدون وارد کردن مجدد، بین آنها جابجا شوید.',
  'key saved': 'کلید ذخیره شد',
  'Endpoint': 'پایانه (Endpoint)',
  'Where the model runs': 'محل اجرای مدل',
  'Base URL': 'آدرس پایه (Base URL)',
  'The host is written to the job log, so you can always see where requests went.': 'نام هاست در گزارش وظایف ثبت می‌شود، بنابراین همیشه می‌توانید مقصد درخواست‌ها را بررسی کنید.',
  'Credential': 'اعتبار و دسترسی',
  'not needed': 'نیازی نیست',
  'optional — none saved': 'اختیاری — چیزی ذخیره نشده',
  'can\'t be read': 'قابل خواندن نیست',
  'needed': 'الزامی است',
  'connected': 'متصل',
  'Replace key': 'جایگزینی کلید',
  'Remove': 'حذف',
  'The stored credential can\'t be decrypted. This usually means <code>./data</code> was restored without its <code>secret</code> file. Add the key again to fix it.': 'اعتبار ذخیره‌شده قابل رمزگشایی نیست. این معمولاً به این معنی است که <code>./data</code> بدون فایل <code>secret</code> بازیابی شده است. برای رفع این مشکل، کلید را مجدداً وارد کنید.',
  'This endpoint works without a key. Add one only if your server asks for it (OpenRouter does; a model on your own network usually does not).': 'این پایانه بدون کلید کار می‌کند. فقط در صورتی کلید اضافه کنید که سرور شما آن را بخواهد (مانند OpenRouter؛ اما یک مدل روی شبکه محلی خودتان معمولاً نیازی ندارد).',
  'Paste either a Claude Code setup token (your subscription) or an Anthropic API key (pay per use).': 'یک توکن راه‌اندازی Claude Code (اشتراک خودتان) یا یک کلید API ارائه‌دهنده Anthropic (پرداخت به ازای مصرف) وارد کنید.',
  'Paste an API key from the provider\'s console. It is stored encrypted on this server and sent to the provider only while a job runs.': 'یک کلید API از پنل ارائه‌دهنده کپی کرده و اینجا قرار دهید. این کلید به شکل رمزنگاری‌شده روی این سرور ذخیره شده و فقط هنگام اجرای وظیفه ارسال می‌شود.',
  'Add Claude Code token': 'افزودن توکن Claude Code',
  'Add API key': 'افزودن کلید API',
  'Add API key (optional)': 'افزودن کلید API (اختیاری)',
  'Model': 'مدل',
  'Which model the provider should use. "List models" asks the provider for its current list, so nothing here goes stale.': 'کدام مدل باید توسط ارائه‌دهنده استفاده شود. «فهرست مدل‌ها» لیست فعلی را از ارائه‌دهنده دریافت می‌کند تا هیچ چیز قدیمی نشود.',
  'Optional. Leave it empty to use the runtime\'s own default.': 'اختیاری. خالی بگذارید تا از مدل پیش‌فرض محیط اجرا استفاده شود.',
  'Pick a model…': 'انتخاب یک مدل…',
  'List models': 'فهرست مدل‌ها',
  'Refresh list': 'به‌روزرسانی فهرست',
  'Test': 'آزمایش',
  'passed': 'موفق',
  'one real round trip, no user data': 'یک درخواست واقعی بدون ارسال داده‌های کاربران',
  'Sends one tiny question to the provider and checks the answer. No training data is involved. Do this after every change above.': 'یک سوال کوچک به ارائه‌دهنده ارسال کرده و پاسخ را بررسی می‌کند. هیچ داده تمرینی ارسال نمی‌شود. پس از هر تغییر در بالا، این آزمایش را انجام دهید.',
  'Test the Coach': 'آزمایش مربی',
  'Finish the Endpoint step first.': 'ابتدا مرحله پایانه را تکمیل کنید.',
  'Finish the Credential step first.': 'ابتدا مرحله اعتبار را تکمیل کنید.',
  'Asking the provider…': 'در حال ارسال درخواست به ارائه‌دهنده…',
  'Passed': 'موفق',
  'The provider answered as expected.': 'ارائه‌دهنده طبق انتظار پاسخ داد.',
  'Failed': 'ناموفق',
  'No answer from the provider.': 'هیچ پاسخی از ارائه‌دهنده دریافت نشد.',
  'Runtime': 'محیط اجرا (Runtime)',
  'missing': 'ناموجود',
  'Advanced': 'تنظیمات پیشرفته',
  'Limits': 'محدودیت‌ها',
  'How many Coach runs are allowed per day. Every run is one request on the provider account above. 0 means no limit.': 'تعداد دفعات مجاز اجرای مربی در هر روز. هر اجرا یک درخواست روی حساب ارائه‌دهنده بالا است. ۰ یعنی بدون محدودیت.',
  'Per user, per day': 'به ازای هر کاربر در روز',
  'Whole instance, per day': 'کل سامانه در روز',
  'How long a chat message, refinement or review note can be. The chat composer and the server both enforce this.': 'حداکثر طول پیام چت، بهینه‌سازی یا یادداشت بررسی. این محدودیت در کادر چت و سرور اعمال می‌شود.',
  'Max message length': 'حداکثر طول پیام',
  'Compare with others': 'مقایسه با دیگران',
  'Let people compare with each other.': 'امکان مقایسه کاربران با یکدیگر.',
  'Whose account pays': 'حساب پرداخت‌کننده',
  'Each profile signs in with their own account.': 'هر نمایه با حساب کاربری خود وارد می‌شود.',
  'One API key for the whole instance: every profile may use the Coach with it, and the daily limits above are what bound the spend.': 'یک کلید API برای کل سامانه: هر نمایه می‌تواند با آن از مربی استفاده کند، و محدودیت‌های روزانه بالا هزینه را مدیریت می‌کنند.',
  'One personal account, already in use by one profile. Every other profile is refused, so nobody spends somebody else\'s subscription.': 'یک حساب شخصی که هم‌اکنون توسط یک نمایه استفاده می‌شود. سایر نمایه‌ها رد می‌شوند تا کسی از اشتراک دیگری مصرف نکند.',
  'One personal account. The first profile to use it becomes the only one allowed to — every other profile is then refused. Paste an API key instead if the whole instance should have the Coach.': 'یک حساب شخصی. اولین نمایه‌ای که از آن استفاده کند تنها مجاز خواهد بود — سایر نمایه‌ها رد می‌شوند. اگر تمام سامانه باید به مربی دسترسی داشته باشند، یک کلید API وارد کنید.',
  'Isolation': 'جداسازی امنیتی',
  'Activity': 'فعالیت‌ها',
  'Jobs today': 'وظایف امروز',
  'Last success': 'آخرین موفقیت',
  'Last failure': 'آخرین شکست',
  'Recent jobs': 'وظایف اخیر',
  'No jobs yet.': 'هنوز وظیفه‌ای انجام نشده است.',
  'Counts and outcomes only. What people asked the Coach, and what it answered, is never shown here.': 'فقط تعداد و نتایج ثبت می‌شود. آنچه افراد از مربی پرسیده‌اند و آنچه مربی پاسخ داده، هرگز در اینجا نمایش داده نمی‌شود.',
  'Save token': 'ذخیره توکن',
  'Save key': 'ذخیره کلید',
  'Connect': 'اتصال',
  'Plan': 'برنامه',
  'Review': 'بررسی',
}

export function tAdmin(text, vars) {
  if (getLang() === 'fa') {
    const tr = ADMIN_FA[text]
    if (typeof tr === 'function') return tr(vars || {})
    if (typeof tr === 'string') {
      if (!vars) return tr
      return tr.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`))
    }
    // Fall back to general i18n dictionary if present
    const gen = t(text, vars)
    if (gen && gen !== text) return gen
  }
  if (!vars) return text
  if (typeof text === 'string') {
    return text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`))
  }
  return text
}

export const durAdmin = ms => {
  const m = Math.max(0, Math.floor(ms / 60000))
  if (getLang() === 'fa') {
    return m < 60 ? `${m} دقیقه` : `${Math.floor(m / 60)} ساعت و ${m % 60} دقیقه`
  }
  return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'
}

export const relAdmin = ts => {
  if (!ts) return getLang() === 'fa' ? 'هرگز' : 'never'
  const time = typeof ts === 'number' ? ts : new Date(ts).getTime()
  const s = Math.max(0, (Date.now() - time) / 1000)
  if (getLang() === 'fa') {
    if (s < 60) return 'همین الان'
    if (s < 3600) return Math.floor(s / 60) + ' دقیقه پیش'
    if (s < 86400) return Math.floor(s / 3600) + ' ساعت پیش'
    return Math.floor(s / 86400) + ' روز پیش'
  }
  if (s < 60) return 'just now'
  if (s < 3600) return Math.floor(s / 60) + ' min ago'
  if (s < 86400) return Math.floor(s / 3600) + ' h ago'
  return Math.floor(s / 86400) + ' d ago'
}

export const credentialHintAdmin = (auth, meta) => {
  const s = auth?.state
  const isFa = getLang() === 'fa'
  if (s === 'connected') {
    if (isFa) return 'متصل' + (auth.account ? ' به عنوان ' + auth.account : '')
    return 'Connected' + (auth.account ? ' as ' + auth.account : '')
  }
  if (s === 'not-required') return isFa ? 'نیازی نیست' : 'Not needed'
  if (s === 'optional') return isFa ? 'برای این پایانه اختیاری است' : 'Optional for this endpoint'
  if (s === 'unreadable') return isFa ? 'کلید ذخیره‌شده خوانده نمی‌شود — مجدداً وارد کنید' : 'Stored key can\'t be read — add it again'
  if (meta.setupToken) return isFa ? 'توکن یا کلید API الزامی است' : 'Token or API key needed'
  return isFa ? 'کلید API الزامی است' : 'API key needed'
}

export const credentialLabelAdmin = type => {
  const isFa = getLang() === 'fa'
  if (isFa) {
    return {
      'cli-token': 'توکن راه‌اندازی Claude Code',
      'chatgpt-cli': 'ورود ChatGPT CLI',
      oauth: 'توکن موروثی',
      apikey: 'کلید API'
    }[type] || 'اطلاعات هویتی'
  }
  return {
    'cli-token': 'Claude Code setup token',
    'chatgpt-cli': 'ChatGPT CLI login',
    oauth: 'legacy token',
    apikey: 'API key'
  }[type] || 'credential'
}

export const failureTitleAdmin = cls => {
  const isFa = getLang() === 'fa'
  if (isFa) {
    return {
      timeout: 'پاسخ‌دهی ارائه‌دهنده بیش از مهلت زمانی مجاز طول کشید (COACH_JOB_TIMEOUT_MS، پیش‌فرض ۵ دقیقه)',
      missing: 'محیط اجرای ارائه‌دهنده یا کلید API ناموجود است',
      auth: 'ارائه‌دهنده اطلاعات هویتی را رد کرد',
      provider: 'ارائه‌دهنده با خطا مواجه شد',
      unusable: 'مدل پاسخ داد، اما پاسخ با ساختار مورد نیاز برنامه سازگار نیست',
      restart: 'سرور در حین اجرای وظیفه ری‌استارت شد',
      nostate: 'امکان خواندن داده‌های تمرینی کاربر وجود نداشت',
      off: 'در زمان اجرای وظیفه، مربی خاموش بود',
      toolarge: 'داده‌های تمرینی کاربر درخواست را بسیار بزرگ کرد، بنابراین درخواستی ارسال نشد',
      internal: 'خطایی در سرور رخ داده است'
    }[cls] || cls || 'ناموفق'
  }
  return {
    timeout: 'The provider took longer than the job budget (COACH_JOB_TIMEOUT_MS, default 5 minutes)',
    missing: 'The provider runtime or key is missing',
    auth: 'The provider rejected the credential',
    provider: 'The provider returned an error',
    unusable: 'The model answered, but not in a shape the app could use',
    restart: 'The server restarted while a job was running',
    nostate: 'The user\'s training data could not be read',
    off: 'The Coach was off when the job ran',
    toolarge: 'The user\'s training data made a request too large to send, so no provider was called',
    internal: 'Something went wrong on the server'
  }[cls] || cls || 'Failed'
}
