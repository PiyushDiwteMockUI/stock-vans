#!/usr/bin/env python3
"""Build assets/reviews-data.js (window.WLREVIEWS) from the raw Apify Google reviews output.

Run from the repo root:  python3 tools/build_reviews_data.py [RAW_DIR]
RAW_DIR defaults to ../../stock-reviews-badge/raw (the raw files are never edited).

Per listing: key, name, placeId, rating (Google totalScore), count (Google reviewsCount),
writeReviewUrl, avatar (data URI of the official logo), reviews kept = 4 or 5 stars with
non-empty text, newest first. Per review only: id, url, name, photo, date (ISO), stars,
text, images (max 4), reply (owner reply text, no date). No reviewer ids, no local guide data.
Plus an "all" summary: count = sum of counts, rating = count-weighted mean to 1 dp.

Review and reply text is third-party / Google-posted text and is kept verbatim, except that the
scraper's literal <br> tags become line breaks.
"""
import base64, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', '..', 'stock-reviews-badge', 'raw')
OUT = os.path.join(HERE, '..', 'assets', 'reviews-data.js')
AV = os.path.join(HERE, 'reviews-avatars')

LISTINGS = [
    # key, raw file, display name, expected placeId, avatar file
    ('wonderland', 'wonderland-rv-caravans.json', 'Wonderland RV Caravans', 'ChIJfd_8yt1P1moRGgJHKZVWRjM', 'wonderland-rv.png'),
    ('outbound', 'outbound-rvs.json', 'Outbound RVs', 'ChIJ73f3u5JP1moRGR33SZPkAfw', 'outbound-rvs.png'),
]


def data_uri(path):
    return 'data:image/png;base64,' + base64.b64encode(open(path, 'rb').read()).decode()


def clean(t):
    """The scraper leaves literal <br> tags in review and reply text; turn them into line breaks.
    Nothing else is changed."""
    t = re.sub(r'<br\s*/?>', '\n', t or '')
    return re.sub(r'\n{3,}', '\n\n', t).strip()


def load_items(path):
    d = json.load(open(path, encoding='utf-8'))
    return d['items'] if isinstance(d, dict) else d


listings = []
for key, fname, name, place_id, avatar in LISTINGS:
    items = load_items(os.path.join(RAW, fname))
    assert items, fname
    assert all(i['placeId'] == place_id for i in items), 'placeId mismatch in ' + fname
    rating = {i['totalScore'] for i in items}
    count = {i['reviewsCount'] for i in items}
    assert len(rating) == 1 and len(count) == 1, 'inconsistent listing score in ' + fname
    kept = []
    for i in items:
        text = clean(i.get('text'))
        if int(i['stars']) not in (4, 5) or not text:
            continue
        reply = clean(i.get('responseFromOwnerText'))
        r = {
            'id': i['reviewId'],
            'url': i['reviewUrl'],
            'name': (i.get('name') or '').strip(),
            'photo': i.get('reviewerPhotoUrl') or '',
            'date': i['publishedAtDate'],
            'stars': int(i['stars']),
            'text': text,
            'images': list(i.get('reviewImageUrls') or [])[:4],
        }
        if reply:
            r['reply'] = reply
        kept.append(r)
    kept.sort(key=lambda r: r['date'], reverse=True)
    listings.append({
        'key': key,
        'name': name,
        'placeId': place_id,
        'rating': next(iter(rating)),
        'count': next(iter(count)),
        'writeReviewUrl': 'https://search.google.com/local/writereview?placeid=' + place_id,
        'avatar': data_uri(os.path.join(AV, avatar)),
        'reviews': kept,
    })
    print('%-24s raw %3d  kept %3d (4-5 stars with text)  Google %s from %d  replies %d  with photos %d' % (
        name, len(items), len(kept), next(iter(rating)), next(iter(count)),
        sum('reply' in r for r in kept), sum(bool(r['images']) for r in kept)))

total = sum(l['count'] for l in listings)
weighted = round(sum(l['rating'] * l['count'] for l in listings) / total, 1)
data = {
    'updated': max(i['scrapedAt'] for l in LISTINGS for i in load_items(os.path.join(RAW, l[1])))[:10],
    'all': {'rating': weighted, 'count': total},
    'listings': listings,
}
js = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
# safe to inline inside a <script> element
js = js.replace('</', '<\\/').replace('<!--', '<\\!--').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
open(OUT, 'w', encoding='utf-8').write('window.WLREVIEWS=' + js + ';\n')
print('all: %s from %d | shown cards %d | wrote %s (%d bytes)' % (weighted, total, sum(len(l['reviews']) for l in listings), os.path.relpath(OUT), os.path.getsize(OUT)))
