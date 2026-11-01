#!/usr/bin/env python3
"""Ana's 29 Oct 2026 stock van emails -> data.js (local only, no live write).
Adds WL1337, WL1155, WL1000 (and WL1027, optional), updates WL1184 (Perth, price, listing spec) and WL901 (price, listing spec).
Run from the stock-vans repo root. Re-runnable: replaces records by chassis."""
import json, sys, os
ROOT = os.getcwd()
LIST = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'autogate-listings-2026-11-02.json')))
BYID = {o['id']: o for o in LIST}
SUF = '?pxc_method=gravityfill&pxc_bgtype=self&pxc_size=1600,1067'
def imgs(aid, limit=None):
    u = [i + SUF for i in BYID[aid]['imgs']]
    return u[:limit] if limit else u
def ccs(aid):
    return BYID[aid]['url']

s = open('data.js', encoding='utf-8').read()
pre = s[:s.index('const DATA = ') + 13]; j0 = s.index('const DATA = ') + 13; j1 = s.index(';\nconst OR_TOKEN')
D = json.loads(s[j0:j1]); suf = s[j1:]
vans = {v['chassis']: v for v in D['vans']}

SECT = ["Construction", "Chassis & Suspension", "Electrical", "Plumbing", "Appliances", "Optional upgrades fitted"]
def spec(con, cha, ele, plu, app, opt):
    return [[SECT[0], con], [SECT[1], cha], [SECT[2], ele], [SECT[3], plu], [SECT[4], app], [SECT[5], opt]]

# ---------------- WL1337 Amaroo 2100 Rear Club Lounge (WA, new) ----------------
WL1337 = dict(
 chassis='WL1337', model='Amaroo', code='2100Q-RC-L', name='Amaroo 2100 Rear Club Lounge', year='2026', length='21\'00"',
 layout='Couples', state='Western Australia', used=False, price=166999.0,
 images=imgs('OAG-AD-26405312'), listing=ccs('OAG-AD-26405312'),
 tare=2879, atm=3500, ball=180, sleeps=2, axle='Tandem axle',
 floorplan='assets/layouts/2100Q-RC.png', was=None,
 floorplans=['assets/layouts/2100Q-RC_tilt.png', 'assets/layouts/2100Q-RC_top.png', 'assets/layouts/2100Q-RC_tag.png'],
 travel=8.8,
 spec_override=spec(
  ['Aluminium Henrob riveted 25mm C-section interlocking frame',
   'One piece 35mm sandwich panel composite roof that wraps around the front and back, no joins on the roof',
   'XPS insulation', 'Honeycomb floor, lightweight, waterproof and one piece',
   'Dibond marine grade aluminium composite panel', '850mm protection plate',
   'Aussie Traveller black 1750 x 622 entry door with security screen and triple locking mechanism',
   'Large double glazed windows with dark tint, non-concertina fly screens and block-out blinds', 'Roller blind on entry door'],
  ['Heavy duty off-road chassis, Australian made RHS steel', '6″ x 2000mm A-frame, 4″ chassis and 4″ riser (4+4″ chassis, flat floor and lightweight top deck)',
   'Cruisemaster XT L3 airbag suspension', '12″ drum brakes', 'Cruisemaster DO35 hitch',
   '16″ wheels with 265/75R16 MPC all terrain tyres (6 x 139, ET0)',
   'Large toolbox with dual slides and 12V Anderson plug, or large toolbox with slide, 12V Anderson plug and hinged gas cylinder compartment',
   '2 x jerry can holders', '4-arm bumper bar with taillights', 'Double aluminium step'],
  ['Victron Micro Touch 50, dual 50A MPPT, 30A DC charger, 120A AC charger and 3000VA inverter charger', '460Ah lithium battery', '1000W 12V solar',
   '1 x grey Anderson plug and 1 x portable solar input', '12 pin tow plug', 'CS Pressure 12V powered dust reduction (pressure tested by RV Leaks)',
   'Additional USB-A and USB-C 120W high current outlet (suits Starlink Mini, iPad and laptop)', 'Multiple USB and USB-C outlets',
   'TV points: 1 x external TV bracket and 1 x internal TV bracket at the lounge',
   'External lights: 17″ light bar front and rear, 3 x insect repellent two stage LED lights door side including BBQ, 1 x road side, LED taillights',
   'Internal lighting: 3″ LED downlights, reading lights at bed and lounge'],
  ['Roto moulded poly water tanks with brass fittings', '2 x 100L fresh water tanks', '1 x 100L grey water tank with bypass',
   'Galvanised sheet water tank and plumbing protection', 'Instant gas hot water system', 'External hot and cold shower',
   '1 x gas bayonet', '2 x 4kg gas bottles', '1 x cold tap on the A-frame', 'Quick fill and mains connection plus 1 separate filler and cap',
   '3 way tall gooseneck kitchen tap with filter, antique brass', 'One piece fibreglass shower', 'Thetford ceramic bowl cassette or ceramic separation toilet'],
  ['Dometic FreshJet air conditioner', '250L My Coolman compressor fridge', 'Portable induction cooktop', 'Multi function cooker', 'Recessed rangehood',
   '3.5kg front loader washing machine', '24″ smart TV and TV antenna', 'Fusion entertainment unit and speakers, external entertainment points and speakers',
   'Reverse camera with car windscreen monitor', '2 x Sirocco fans', 'Dometic grey awning with black arms and awning support',
   'External pantry and picnic table with light, GPO and USB', 'High access tunnel boot doors',
   'CNC lightweight ply furniture, precision cut with no gaps', 'Lightweight European plywood laminate benchtops and doors',
   'Full height pantry with soft close drawers, large metal sided pot drawer and dual pull out bin', 'Firm back lounge seating with support and footrest, telescopic table leg',
   'Queen 6′3″ pillowtop mattress, bedhead and magazine pockets', '2 x large roof hatches, LED hatch with fan in the bathroom',
   'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['Cruisemaster XT L3 airbag suspension', '460Ah lithium with 1000W solar and 3000VA inverter charger', '120W USB-A and USB-C high current outlet',
   'Antique brass tapware', '250L My Coolman compressor fridge', 'Rear club lounge layout with drop down table']),
 spec_source='ana')

# ---------------- WL1155 Solara 2100 Twin Bunk Family (WA, 2025 showroom demo, new) ----------------
WL1155 = dict(
 chassis='WL1155', model='Solara', code='2100Q1-F2.0', name='Solara 2100 Twin Bunk Family', year='2025', length='21\'00"',
 layout='Family', state='Western Australia', used=False, price=198452.0,
 images=imgs('OAG-AD-26396189'), listing=ccs('OAG-AD-26396189'),
 tare=3000, atm=4500, ball=160, sleeps=4, axle='Tandem axle',
 floorplan='assets/layouts/2100Q1-F2-0.png', was=None,
 floorplans=['assets/layouts/2100Q1-F2-0_tilt.png', 'assets/layouts/2100Q1-F2-0_top.png', 'assets/layouts/2100Q1-F2-0_tag.png'],
 travel=8.8,
 spec_override=spec(
  ['Frameless composite sandwich panel construction, 35mm XPS composite walls, Australian made and owned', 'One piece roof, front to back',
   'Honeycomb floor, lightweight, waterproof and one piece', 'Dometic CaraDoor 1850 x 622 entry door with security screen',
   'Twin bedroom windows with non-concertina fly screens and block-out blinds', 'Double glazed windows with dark tint', 'Roller blind on entry door',
   'Showroom demo van, used for a handful of marketing trips and shows'],
  ['Heavy duty off-road chassis, Australian made RHS steel by S&M Chassis', '6″ x 1950mm A-frame', '4.5T Cruisemaster XT L3 airbag suspension with BCS levelling',
   '12″ drum brakes', 'Cruisemaster DO45 hitch and 4T chains', 'MP Toughcoat chassis protection', '4-arm bumper bar',
   'Monster rear bar with jerry can holder, wood box, spare wheel holder and storage compartments',
   'Large toolbox with visor, large dual slides and 12V Anderson plug, or TB32S toolbox with 12V Anderson plug, 1 long slide and hinged gas cylinder compartment',
   'ROH black 17″ wheels with 265/70R17 Yokohama AT-X tyres (6 x 139)', 'Caravan jack and brace', 'BOS jockey wheel', 'Drop down corner stabilisers',
   'Double aluminium step', 'Rear recovery points and skid plates', 'ISI quad bike carrier', 'Solar wing'],
  ['Nexus and Victron Off-Grid Touch 70 battery management, behind-fridge installation', '900Ah lithium battery', '3000W inverter', '1350W solar',
   '1 x grey Anderson plug and 1 x portable solar input', 'CS Pressure 12V powered dust reduction', 'Cowfish antenna and Starlink connection point',
   'Multiple USB and USB-C outlets', 'Multiple TV points: 1 x external TV bracket and 1 x internal TV bracket',
   '6 external lights: 17″ light bar front and rear, 3 x insect repellent two stage LED lights door side including over the BBQ, 1 x road side',
   'LED 3″ downlights and reading lights', 'LED taillights', '12 pin tow plug'],
  ['Roto moulded poly water tanks with brass fittings', '2 x 100L fresh water tanks', '1 x 70L and 1 x 90L dedicated drinking water tanks', '1 x 100L grey water tank',
   'Galvanised sheet water tank and plumbing protection', 'Diesel heater and hot water unit', 'External hot and cold shower', '1 x gas bayonet', '2 x 4kg gas bottles',
   '1 x cold tap on the A-frame', 'Quick fill and mains connection plus 1 separate filler and cap', '3 way tall gooseneck kitchen tap with filter, brass gold',
   'One piece fibreglass shower', 'Thetford ceramic separation toilet'],
  ['Dometic FreshJet 3kW air conditioner', '220L Dometic compressor fridge', 'Portable induction cooktop', 'Camec 3 in 1 multi function cooker', 'Swift recessed rangehood',
   '3kg wall mounted washing machine', '24″ smart TV', 'Fusion premium entertainment pack with indoor and outdoor speakers, external entertainment points',
   'Safety Dave reverse camera and car monitor', '4 x Sirocco fans', 'Dometic grey awning with black arms and awning support',
   'Fully lined galvanised sheet tunnel boot with high access doors', 'External pantry with light, GPO and USB', 'Stone benchtops',
   'Full height pantry with pull out bin, soft close drawers', 'Firm back lounge seating with support and footrest, telescopic table leg',
   'Queen 6′6″ pillowtop mattress, bedhead and magazine pockets', 'Large roof hatches, LED hatch with fan in the bathroom',
   'Two bunk layout: 1.9m long x 75cm wide bunks with 120kg loading, upholstered bed head, reading light and USB, built in ladder with grab handle, concertina door',
   'Bunk mesh barriers by Aussie Canvas fitted', 'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['4.5T Cruisemaster XT L3 airbag suspension with BCS levelling', '900Ah lithium, 1350W solar with solar wing, 3000W inverter', 'ISI quad bike carrier',
   'Monster rear bar', 'Diesel heater and hot water unit', 'Stone benchtops and brass gold tapware', 'Bunk mesh barriers']),
 spec_source='ana')

# ---------------- WL1000 XTR 2304 Twin Bunk with Kids Retreat (VIC, 2025, pre-loved) ----------------
WL1000 = dict(
 chassis='WL1000', model='XTR', code='2304F-2 Custom', name='XTR 2304 Twin Bunk Kids Retreat Family', year='2025', length='23\'04"',
 layout='Family', state='Victoria', used=True, price=209999.0,
 images=imgs('OAG-AD-26391364'), listing=ccs('OAG-AD-26391364'),
 tare=3540, atm=4500, ball=280, sleeps=4, axle='Tandem axle',
 floorplan=None, was=None, floorplans=[], travel=9.5,
 spec_override=spec(
  ['Aluminium Henrob riveted 25mm C-section interlocking frame', 'One piece 35mm sandwich panel composite roof that wraps around the front and back, no joins',
   'Honeycomb floor, lightweight, waterproof and one piece', 'XPS insulation', 'Dibond marine grade aluminium composite panel in dark grey metallic',
   '850mm X-Guard PU textured flat plate protection', 'Aussie Traveller black 1750 x 622 entry door with security screen and triple locking mechanism',
   'Large double glazed windows with dark tint, flat non-concertina fly screens and block-out blinds', 'Roller blind on entry door'],
  ['Heavy duty off-road chassis, Australian made RHS steel, hot dip galvanised', '6″ x 2100mm A-frame and 12″ truss chassis',
   '4.5T Cruisemaster ATX airbag suspension with BCS Horizon levelling controller', 'Cruisemaster DO45 hitch and 4.5T chains',
   'ROH 17″ wheels (6 x 139, ET0) with 285/70R17 Yokohama AT-X Geolandar tyres', 'Mammoth toolbox with Texture Guard coated front and slides',
   'Caravan jack and brace', 'Rear bumper with storage drawer, 2 x jerry can holders, wood box and LED taillights', 'Skid plates and recovery points', 'Double step'],
  ['Custom Arizon behind-fridge electrical board', 'Victron 24V Off-Grid Touch 70, behind-fridge installation', '5000VA inverter (run several 240V appliances at once)',
   '1560W rooftop solar (glass panels)', '3 x 24V 230Ah lithium batteries (equivalent to 1380Ah at 12V)', '2 x 24V 15A DC chargers, Apex board upgrade',
   '1 x grey Anderson input and 1 x portable solar input',
   '6 external lights: 17″ light bar front and rear, 3 x insect repellent two stage LED lights door side including over the BBQ, 1 x road side',
   'Internal LED downlights, reading lights and LED strip lighting', 'Starlink provision', 'TV antenna and Explorer input', 'USB outlets at seating, bedroom and externally',
   'Wireless chargers'],
  ['3 x 100L fresh water tanks', '1 x 100L grey water tank with bypass', '1 x 90L dedicated drinking water tank', 'Quick fills and mains water connection',
   'Hydronic diesel hot water system and heater (gasless)', 'OGO composting toilet', 'Hot and cold external shower', '1 x BBQ gas bayonet', '1 x cold tap on the A-frame',
   '2 x 4.5kg gas bottles', '3 way tall gooseneck kitchen tap with filter, gunmetal grey', 'Water filter'],
  ['Dual Dometic FreshJet air conditioners', '224L Dometic compressor fridge and freezer', 'Portable induction cooktop', 'Multi function cooker', 'Swift recessed rangehood',
   '3kg wall mounted washing machine', '32″ and 24″ smart TVs with internal and external points', 'Fusion premium entertainment pack, indoor and outdoor soundbars with amplifier',
   'Safety Dave reverse camera and car monitor', '5 x Sirocco fans', 'Carefree electric awning with black arms and awning support',
   'Fully lined galvanised tunnel boot with external slide out kitchen: Weber K5i BBQ provision, sink and portable induction cooktop', 'High access tunnel boot doors',
   'External pantry with light, GPO, USB and external entertainment pack', 'CNC lightweight ply furniture, precision cut with no gaps',
   'Thinscape solid compressed laminate benchtops with waterfall end', 'Full height pantry with soft close drawers, soft close drawers throughout, double rubbish bin',
   'Firm back lounge seating with support and footrest, black telescopic table leg', 'Queen 6′8″ pillowtop mattress, bedhead and magazine pockets',
   'Large roof hatches, LED hatch with fan in the bathroom',
   'Kids retreat: dedicated kids lounge with 32″ TV and air conditioner, 1.9m x 75cm bunks with 120kg loading, upholstered bed heads, reading lights and USB, built in ladder with grab handle, concertina door',
   'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['24V Victron system by Arizon: 5000VA inverter, 1560W solar, 3 x 24V 230Ah lithium', 'Dual air conditioners', '4.5T Cruisemaster ATX airbag suspension with BCS Horizon',
   'Hydronic diesel hot water and heating', 'External slide out kitchen', 'Kids retreat layout with its own TV', 'OGO composting toilet']),
 spec_source='ana')

# ---------------- WL1027 Hornet 2100 Twin Bunk Family (VIC, 2024, pre-loved) OPTIONAL ----------------
WL1027 = dict(
 chassis='WL1027', model='Hornet', code='2100Q2-F2.1', name='Hornet 2100 Twin Bunk Family', year='2024', length='21\'00"',
 layout='Family', state='Victoria', used=True, price=134999.0,
 images=imgs('OAG-AD-26384866'), listing=ccs('OAG-AD-26384866'),
 tare=2900, atm=3500, ball=200, sleeps=4, axle='Tandem axle',
 floorplan=None, was=None, floorplans=[], travel=8.8,
 spec_override=spec(
  ['One piece 35mm sandwich panel composite roof that wraps around the front and back, no joins', 'XPS insulation', 'Honeycomb floor, lightweight, waterproof and one piece, no joins',
   'Dibond marine grade aluminium composite panel in limited edition Eucalyptus Green', '850mm protection plate',
   'Aussie Traveller black 1750 x 622 entry door with security screen and triple locking mechanism', 'Large double glazed windows with dark tint, fly screens and block-out blinds',
   'Roller blind on entry door', 'Built November 2024, still under warranty'],
  ['Heavy duty off-road chassis, Australian made RHS steel', '6″ x 1950mm A-frame and double 4+4″ chassis', '4.5T Cruisemaster XT L3 manual airbag suspension', '12″ drum brakes',
   'Cruisemaster DO45 hitch', 'Black MP Toughcoat chassis finish', 'Aluminium stone deflector', '4-arm bumper bar with taillights', '2 x jerry can holders on the rear bar',
   'Large toolbox with dual slides and 12V Anderson plug', 'Gridd 16″ wheels (6 x 139, ET20) with 285/75R16 Cooper AT3 tyres', 'Caravan jack and brace', 'AL-KO 8″ wide large clamp',
   'Drop down corner stabilisers', 'Double aluminium step', 'Rear recovery points and skid plates', 'Dexter stability control'],
  ['Victron 12V behind-fridge installation', '3000VA inverter', '1000W solar', '400Ah Arizon lithium battery', '1 x grey Anderson plug and 1 x portable solar input',
   'CS Pressure 12V powered dust reduction', 'Omni Winegard or Cowfish antenna', 'Starlink provision', 'Multiple USB and USB-C outlets',
   'Multiple TV points: 1 x external TV bracket and 1 x internal TV bracket',
   '6 external lights: 17″ light bar front and rear, 3 x insect repellent two stage LED lights door side including over the BBQ, 1 x road side', 'LED 3″ downlights and reading lights',
   'LED taillights', '12 pin tow plug'],
  ['Roto moulded poly water tanks with brass fittings', '2 x 100L fresh water tanks', '1 x 70L isolated dedicated drinking water tank', '1 x 100L grey water tank',
   'Galvanised sheet water tank and plumbing protection', 'Instant gas hot water unit', 'External hot and cold shower', '1 x gas bayonet', '2 x gas bottles', '1 x cold tap on the A-frame',
   'Quick fill and mains connection plus 1 separate filler and cap', '3 way tall gooseneck kitchen tap with filter', 'One piece fibreglass shower', 'Thetford ceramic bowl cassette toilet'],
  ['Dometic FreshJet 2.9kW air conditioner', '216L Dometic compressor fridge', 'Swift 4 burner gas stove and grill, or portable induction cooktop', 'Mini grill and gas cooktop', 'Swift recessed rangehood',
   '3kg wall mounted washing machine', '24″ smart TV', 'Fusion premium entertainment pack with indoor and outdoor speakers, external entertainment points',
   'Safety Dave reverse camera and car monitor', '4 x Sirocco fans', 'Dometic grey awning with black arms and awning support, or electric awning', 'Fully lined galvanised sheet tunnel boot with high access metal doors',
   'External picnic table with light, GPO and USB', 'CNC lightweight ply furniture, precision cut with no gaps', 'Lightweight European plywood laminate benchtops and doors',
   'Full height pantry with soft close drawers, large metal sided pot drawer', 'Firm back lounge seating with support and footrest, telescopic table leg',
   'Queen 6′6″ pillowtop mattress, bedhead and magazine pockets', 'Large roof hatches, LED hatch with fan in the bathroom',
   'Two bunk layout: 190cm x 75cm bunks with 120kg loading, upholstered bed head, reading light and USB, built in ladder with grab handle, concertina door for privacy',
   'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['4.5T Cruisemaster XT L3 manual airbag suspension', 'Dexter stability control', 'Victron 400Ah lithium, 1000W solar, 3000VA inverter', 'Limited edition Eucalyptus Green panels']),
 spec_source='ana')

# ---------------- WL1184 update: now in Perth, Autogate price, listing spec ----------------
w = vans['WL1184']
w['state'] = 'Western Australia'; w['price'] = 197115.0; w['was'] = None
w['listing'] = ccs('OAG-AD-25477067')
w['images'] = [f'assets/vans/WL1184/0{i}.jpg' for i in range(1, 7)] + imgs('OAG-AD-25477067')
w['travel'] = 9.4
w['spec_override'] = spec(
  ['Aluminium Henrob riveted 25mm C-section interlocking frame', 'One piece 35mm sandwich panel composite roof that wraps around the front and back, no joins',
   'XPS insulation', 'Honeycomb floor, lightweight, waterproof and one piece', 'Dibond marine grade German composite panel', '850mm protection plate',
   'CaraDoor 1850 x 622 entry door', 'Large double glazed windows with dark tint, non-concertina fly screens and block-out blinds', 'Roller blind on entry door'],
  ['Heavy duty off-road chassis, Australian made RHS steel', '6″ x 1950mm A-frame and double 4+4″ chassis', '4.5T Cruisemaster XT Level 5 BCS airbag suspension', 'Disc brakes',
   'Cruisemaster DO45 hitch', 'MP Toughcoat chassis finish', 'Aluminium stone deflector', '4-arm bumper bar with taillights', '2 x jerry can holders on the rear bar',
   'TB98 toolbox with large dual slides and 12V Anderson plug', 'ROH black 17″ wheels with 265/70R17 Yokohama AT-X tyres', 'Caravan jack and brace', 'AL-KO 8″ wide large clamp',
   'BOS corner stabilisers', 'Double aluminium step', 'Rear recovery points and skid plates'],
  ['Behind-fridge electrical installation with Victron Off-Grid Touch 70 battery management', '600Ah lithium battery', '5 x 200W solar', '3000VA inverter',
   '1 x grey Anderson plug and 1 x portable solar plug', 'CS Pressure 12V powered dust reduction', 'Starlink provision', 'Multiple USB and USB-C outlets',
   'Multiple TV points: 1 x external TV bracket and 1 x internal TV bracket',
   '6 external lights: 17″ light bar front and rear, 3 x insect repellent two stage LED lights door side including over the BBQ, 1 x road side', 'LED 3″ downlights and reading lights',
   'LED taillights', '12 pin tow plug'],
  ['Roto moulded poly water tanks with brass fittings', '2 x 100L fresh water tanks', '1 x 70L isolated dedicated drinking water tank', '1 x 100L grey water tank with bypass',
   'Galvanised sheet water tank and plumbing protection', 'Hydronic diesel heater and hot water system', 'External hot and cold shower', '1 x gas bayonet', '2 x 4kg gas bottles',
   '1 x cold tap on the A-frame', 'Quick fill and mains connection plus 1 separate filler and cap', '3 way tall white gooseneck kitchen tap with filter', 'White granite sink',
   'One piece fibreglass shower', 'Thetford ceramic separation toilet'],
  ['Dometic FreshJet 3.4kW air conditioner', '224L Dometic compressor fridge', 'Portable induction cooktop', 'Camec 3 in 1 multicooker', 'Swift recessed rangehood',
   '3kg wall mounted washing machine', '24″ smart TV (no TV antenna)', 'Fusion premium entertainment pack with indoor and outdoor speakers, external entertainment points',
   'Safety Dave reverse camera and car monitor', '5 x Sirocco fans', 'Freedom Carefree electric awning with Bluetooth and wind sensor',
   'K6-Plus external slide out kitchen with induction cooktop, 2 x gas hobs and BBQ provision', 'Fully lined galvanised sheet tunnel boot with high access doors',
   'External pantry with light, GPO and USB, plus an additional black picnic table', 'CNC lightweight ply furniture, precision cut with no gaps',
   'Lightweight European plywood laminate benchtops and doors', 'Full height pantry with soft close drawers and dual pull out bins, large metal sided pot drawer',
   'Firm back lounge seating with support and footrest, telescopic table leg', '6′8″ east-west pillowtop mattress, bedhead and magazine pockets',
   '2 x 700 x 500 large roof hatches, LED hatch with fan in the bathroom',
   'Quad bunk layout: 190cm x 75cm bunks with 120kg loading, upholstered bed heads, reading lights and USB, built in ladder with grab handle, concertina door',
   'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['4.5T Cruisemaster XT Level 5 BCS airbag suspension and disc brakes', '600Ah lithium, 1000W solar, 3000VA inverter', 'Hydronic diesel heater and hot water',
   'K6-Plus external slide out kitchen', 'Freedom Carefree electric awning with wind sensor', 'White granite sink and white tapware'])
w['spec_source'] = 'ana'

# ---------------- WL901 update: Autogate price, listing spec ----------------
w = vans['WL901']
w['price'] = 149999.0; w['was'] = None
w['listing'] = ccs('OAG-AD-26004875')
w['images'] = imgs('OAG-AD-26004875')
w['spec_override'] = spec(
  ['One piece 35mm sandwich panel composite roof that wraps around the front and back, no joins', 'Honeycomb floor, lightweight, waterproof and one piece', 'XPS insulation',
   'Dibond marine grade composite panel', '850mm protection plate', 'Aussie Traveller black 1750 x 622 entry door with security screen and triple locking mechanism',
   'Large double glazed windows with dark tint, flat non-concertina fly screens and block-out blinds', 'Roller blind on entry door'],
  ['12″ truss chassis with extended A-frame, made by S&M Chassis', 'Cruisemaster ATX Unleashed airbag suspension with advanced BCS Horizon levelling',
   'Bosch stability control with ABS braking', '12″ drum brakes', 'Cruisemaster DO45 coupling', 'Black Toughcoat chassis finish',
   'DWC Convict 17″ wheels with 265/70R17 Mickey Thompson Baja Boss A/T tyres and 1 spare', 'Dual TB68 storage boxes with 2 slides and 2 x Anderson plugs', 'Stone deflector',
   '4-arm bumper bar with 2 x jerry can holders', 'Double step, caravan jack and brace', 'BOS jockey plate and BOS stabiliser legs', 'ISI quad bike carrier',
   '2 x chassis mounted shoe boxes'],
  ['Victron Micro GX Touch with dual 30A MPPT and MultiPlus II', '600Ah lithium batteries', 'GX Touch Plus and Cerbo', '3000W inverter with 120A AC charger', '2 x 30A and 50A MPPT solar regulators',
   '1 x grey Anderson input and 1 x portable solar input', 'USB outlets at seating, bedroom and externally', 'External entertainment pack with hatch',
   'LED lighting inside and out: 6 external lights with 3 anti-bug lights, internal LED downlights, amber ambient mood LED lighting', 'TV antenna and Starlink connection point',
   '12V powered dust suppression system', 'Witi anti theft and GPS tracker', 'Stedi surface LED rock lights under the chassis', '240V GPO above the tunnel boot'],
  ['2 x 100L fresh water tanks', '1 x 100L grey water tank with bypass', '1 x 55L dedicated drinking water tank', 'Quick fills and mains water connection, separate fillers for each tank',
   'Swift gas and electric hot water unit', 'Diesel heater', 'Thetford toilet', 'Hot and cold external shower', '1 x BBQ gas bayonet', '1 x cold tap to the A-frame', '2 x gas bottles',
   '3 way tall gooseneck kitchen tap with filter and ensuite tap, black'],
  ['Dometic Harrier air conditioner', '224L Dometic compressor fridge and freezer', 'Portable induction cooktop and Swift recessed rangehood', '23L mirrored microwave',
   '3.5kg front loader washing machine', '28″ smart TV with internal and external points', 'Fusion sound system and speakers', 'Twin lens Safety Dave reverse camera and car monitor',
   'Dometic grey awning with black arms and awning support, anti-flap kit with curved roof rafters', 'Fully lined galvanised tunnel boot with external slide out and high access doors',
   'Black picnic table', 'CNC lightweight ply furniture, precision cut with no gaps', 'Lightweight European plywood laminate benchtops and doors with waterfall benchtop',
   'Full height pantry with soft close drawers, soft close drawers throughout', 'Firm back lounge seating with support and footrest, telescopic table leg',
   '6′6″ pillowtop mattress, bedhead and magazine pockets', 'Large roof hatches, LED hatch with fan in the bathroom', 'Breakaway, smoke detector, LPG detector, fire blanket and fire extinguisher'],
  ['Cruisemaster ATX Unleashed airbag suspension with BCS Horizon', 'Bosch stability control with ABS', 'Victron 600Ah lithium with 3000W inverter', 'ISI quad bike carrier',
   'Witi anti theft and GPS tracker', 'Stedi rock lights', 'Diesel heater'])
w['spec_source'] = 'ana'

# order: keep existing order, append new vans (WL1027 only with --with-wl1027)
new = [WL1337, WL1155, WL1000] + ([WL1027] if '--with-wl1027' in sys.argv else [])
for n in new:
    if n['chassis'] in vans:
        D['vans'] = [n if v['chassis'] == n['chassis'] else v for v in D['vans']]
    else:
        D['vans'].append(n)
open('data.js', 'w', encoding='utf-8').write(pre + json.dumps(D, indent=1, ensure_ascii=False) + suf)
print('vans now', len(D['vans']), [v['chassis'] for v in D['vans']])
for v in D['vans']:
    if v['chassis'] in ('WL1337', 'WL1155', 'WL1000', 'WL1027', 'WL1184', 'WL901'):
        print(v['chassis'], v['name'], v['state'], v['price'], 'was', v['was'], 'used', v['used'], 'imgs', len(v['images']), 'floorplan', v.get('floorplan'))
