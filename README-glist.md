# Görünən və səhifələnmiş BNAME

Mənbə: main@833ca606086420ff206231de9940cf01ab47c46c `glist.html` (Git blob 51fdb4385751301b8bc819978e052152ea2a367a).

`glist.html` 31 səhifəyə keçid verir. BNAME məlumatları `glist/page-001.html` ... `page-031.html` daxilində tam görünən HTML cədvəlləridir. Hər səhifədə maksimum 5000 qeyd, faktiki ölçülər 591683–669080 baytdır. Son səhifədə 4431 qeyd var. CHANNELS, EXAMPLES, mənbədəki tarix xanaları və YLIST nümunəsi ayrı, görünən mətn kimi qorunub. EXAMPLES reyestrin faktiki qeydləri sayılmır.

Bütün 154431 BID/BNAME ilkin sıra, hərf, boşluq və tip ilə bərabərdir. 14 ədədi ad, `12-May`/`Sep-01`, boş BID nümunələri dəyişdirilməyib. Null nümunə xanaları boş göstərilir, data-value-type=null kimi qeyd edilir. Heç bir script, AJAX, client pagination və gizli ad JSON-u yoxdur. Səhifələrin başı/sonunda əvvəlki/növbəti linkləri var; indeks bütün səhifələri birbaşa linkləyir. Mövcud `index.html` dəyişməyib.

Yenidən qurmaq və yoxlamaq (Python3 standart kitabxanası):

```sh
git show 833ca606086420ff206231de9940cf01ab47c46c:glist.html > /tmp/glist-original.html
python3 scripts/build-glist.py /tmp/glist-original.html .
python3 tests/test_glist.py /tmp/glist-original.html
```

7 yoxlama: bütün sətirlərin dəqiq bərabərliyi; BID dublikat/yoxluğu; ilkin Git blob; fayl ölçüsü/sətir/hesh; skriptsizlik və linklərin mövcudluğu; qayda/nümunə/metadata ayrılığı; xüsusi Azərbaycan hərfləri, ədədi və tarixə oxşar adlar. 7/7 PASS. `glist/manifest.json` faylların hesh və saylarını saxlayır, ad bazasını təkrarlamır.

Bu dəyişiklik crawlable təqdimatı təmin edir; Google-un dərhal indeksləməsinə və AI-ın bütün31 səhifəni bir sorğuda oxumasına zəmanət deyil. Preview-də Vercel giriş qorunması saxlanılır. Əsas açıq domenə yayımlanma ayrıca təsdiqlənməlidir.
