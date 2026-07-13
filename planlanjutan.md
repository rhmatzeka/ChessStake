# Plan Lanjutan ChessStake

## Tujuan

Dokumen ini merangkum kekurangan project ChessStake dari sisi bisnis, produk, marketing, growth, dan monetization. Tujuannya adalah mengubah project dari sekadar demo hackathon menjadi produk yang lebih matang, lebih mudah dipahami, lebih mudah dipasarkan, dan punya peluang menghasilkan uang.

## Kesimpulan Utama

Project saat ini sudah cukup kuat sebagai demo teknis:

- Ada live chess arena.
- Ada voting bidak.
- Ada wallet/Web3 angle.
- Ada reward pool.
- Ada AI move resolver sederhana.
- Ada board live berbasis FEN.
- Ada database untuk menyimpan game, bet, turn, move, settlement, dan spectator.
- Ada smart contract untuk pool, reward, refund, dan platform fee.

Namun dari sisi bisnis, project masih kurang matang karena:

- Target user belum tajam.
- Landing page masih menjelaskan fitur, bukan menjual value.
- Growth loop belum jelas.
- Belum ada creator/streamer mode.
- Belum ada lobby banyak match.
- Belum ada leaderboard nyata.
- Belum ada viral sharing.
- Belum ada event/tournament system.
- Monetization masih terlihat seperti platform mengambil fee, bukan membantu creator menghasilkan uang.
- Kata "betting" terlalu riskan untuk marketing dan regulasi.

Direction terbaik adalah mengubah ChessStake dari:

```text
Web3 AI Chess Betting Arena
```

menjadi:

```text
Interactive AI Chess Arena for Creators and Communities
```

atau:

```text
Twitch Plays Chess with Real Stakes
```

## Positioning Baru

### Positioning Lama

```text
ChessStake is a live Web3 chess arena where spectators back White or Black, vote for the piece type with testnet ETH, and watch an AI resolve the best legal move in realtime.
```

Masalah:

- Terlalu teknis.
- Terlalu fokus ke betting.
- Tidak jelas target user-nya.
- Tidak menjelaskan kenapa creator atau komunitas harus memakai produk ini.

### Positioning Baru

```text
ChessStake is an interactive AI chess arena where creators host live matches, fans back teams, vote strategy, and share rewards from the outcome.
```

Value utama:

- Untuk creator: monetization dan engagement.
- Untuk fans: ikut menentukan game, bukan cuma menonton.
- Untuk komunitas: kompetisi live yang social dan repeatable.
- Untuk platform: revenue dari fee, creator tools, tournament, dan sponsorship.

## Target Market

### Target Utama

Target terbaik untuk awal adalah:

```text
Chess streamers and Web3 gaming communities
```

Alasannya:

- Mereka sudah punya audience.
- Mereka butuh konten live yang interaktif.
- Mereka butuh monetization selain ads dan donation.
- Mereka terbiasa dengan event, tournament, dan community challenge.
- Mereka bisa membawa user baru ke platform.

### Target Sekunder

- Online chess communities.
- Web3 gaming guilds.
- AI entertainment communities.
- Tournament organizers.
- Creator economy platforms.

## Kekurangan Project Saat Ini

## 1. Landing Page Belum Menjual

File terkait:

```text
apps/web/src/app/page.tsx
```

Landing page saat ini masih menjelaskan fitur dasar:

```text
Vote the piece. AI makes the move.
```

Yang kurang:

- Belum ada problem statement.
- Belum ada target user.
- Belum ada value untuk creator.
- Belum ada revenue story.
- Belum ada social proof.
- Belum ada CTA untuk host match.
- Belum ada explanation bahwa ini bisa menjadi format konten live.

Yang perlu ditambahkan:

- Hero baru.
- Section "For Creators".
- Section "How It Works".
- Section "Revenue Model".
- Section "Game Modes".
- CTA "Enter Arena" dan "Host a Match".

Contoh hero baru:

```text
Twitch Plays Chess with Real Stakes
```

Contoh subheadline:

```text
ChessStake lets creators host live AI chess arenas where fans back a team, vote strategy, and share the upside.
```

## 2. Arena Page Masih Terasa Seperti Demo

File terkait:

```text
apps/web/src/components/arena/ArenaPage.tsx
```

Yang kurang:

- Tidak ada match title.
- Tidak ada host/creator identity.
- Tidak ada share button.
- Tidak ada event narrative.
- Tidak ada current spectators di header.
- Tidak ada next match CTA.
- Tidak ada creator branding.
- Tidak ada "invite friends".

Yang perlu ditambahkan:

- Match title, misalnya "AI Boss Battle #12".
- Host info, misalnya "Hosted by ChessStake" atau creator name.
- Spectator count di header.
- Share arena button.
- Creator revenue badge.
- Next match reminder.
- Post-game CTA: "Join Next Match" atau "Host Your Own".

## 3. Voting Panel Belum Cukup Kompetitif

File terkait:

```text
apps/web/src/components/voting/VotingPanel.tsx
```

Masalah sekarang:

- Masih menampilkan raw wei.
- Tidak ada progress bar per bidak.
- Tidak ada ranking bidak.
- Tidak ada label "currently winning".
- Tidak ada "your vote".
- Tidak ada estimated amount to overtake.
- Copy masih sangat transaksional.

Yang perlu ditambahkan:

- Format ETH, bukan raw wei.
- Progress bar untuk setiap piece.
- Badge "Leading" untuk piece dengan pool tertinggi.
- Badge "Your Pick" setelah user vote.
- Text "Needs X ETH to overtake".
- Total backers per piece.
- Better copy: "Choose White's strategy" bukan hanya "Place Your Bet".

Contoh copy baru:

```text
Back the piece you believe should move next. The highest-backed legal piece controls this turn.
```

## 4. Reward Pool Panel Kurang Mendorong User Ikut

File terkait:

```text
apps/web/src/components/arena/RewardPoolPanel.tsx
```

Yang kurang:

- Belum ada platform fee estimate.
- Belum ada reward pool after fee.
- Belum ada team momentum.
- Belum ada pool percentage.
- Belum ada CTA untuk mengejar team lawan.

Yang perlu ditambahkan:

- Total prize pool.
- Estimated reward pool after fee.
- White percentage vs Black percentage.
- Current favorite team.
- "Black needs 0.02 ETH to overtake White".
- Creator share jika creator mode aktif.

## 5. Leaderboard Masih Placeholder

File terkait:

```text
apps/web/src/app/leaderboard/page.tsx
```

Masalah:

Leaderboard sekarang belum berfungsi. Untuk produk seperti ini, leaderboard bukan fitur tambahan, tapi fitur retention.

Leaderboard yang perlu dibuat:

- Top earners.
- Most active backers.
- Highest total backed.
- Best win rate.
- Most accurate piece voters.
- Top creator arenas.
- Biggest prize pools.

Manfaat:

- User punya alasan balik.
- User punya identity.
- User bisa share rank.
- Komunitas punya kompetisi jangka panjang.

## 6. Belum Ada Match Lobby

Saat ini user langsung diarahkan ke satu arena:

```text
/arena/live
```

Masalah:

- Produk terasa seperti satu demo statis.
- Tidak terlihat ada banyak aktivitas.
- Tidak ada discovery.
- Tidak ada upcoming event.

Yang perlu dibuat:

```text
/matches
```

Isi halaman:

- Live matches.
- Upcoming matches.
- Past results.
- Creator arenas.
- Tournament cards.
- Prize pool.
- Spectator count.
- Join button.

Contoh match card:

```text
AI Boss Battle #12
White Crowd vs Black Crowd
Prize Pool: 0.32 ETH
Spectators: 42
Status: Voting Now
CTA: Join Arena
```

## 7. Belum Ada Creator Mode

Ini adalah kekurangan bisnis terbesar.

Produk akan jauh lebih mudah ramai kalau creator bisa membuat arena sendiri.

Fitur yang perlu dibuat:

```text
Host a Match
```

Form creator:

- Match title.
- Match description.
- Creator name.
- Creator wallet address.
- Voting duration.
- Minimum stake.
- Creator fee percentage.
- Public/private match.
- Scheduled start time.

Output:

```text
/arena/[creatorSlug]/[matchId]
```

Kenapa penting:

- Creator punya alasan share link.
- Audience datang dari creator.
- Creator mendapat revenue share.
- Platform tidak perlu mencari semua user sendiri.

## 8. Belum Ada Viral Sharing

Yang perlu ditambahkan:

- Share arena button.
- Copy link.
- Share to X/Twitter.
- Share result.
- Share "I backed Queen and won".
- Invite team members.
- Referral link.

Contoh share copy:

```text
Team White is controlling the board. Join before the next vote closes.
```

```text
I backed the Queen move that won the match on ChessStake.
```

```text
Black needs 0.04 ETH to flip the next move. Join the arena.
```

## 9. AI Angle Belum Maksimal

Saat ini AI move resolver masih heuristic sederhana. Untuk marketing, AI sebaiknya bukan cuma pemilih move, tapi bagian dari entertainment.

Yang perlu ditambahkan:

- AI move explanation.
- AI commentator.
- AI match recap.
- AI personality.
- AI boss mode.
- Crowd vs AI.

Contoh fitur:

```text
After every move, AI explains why the move was selected and what threat it creates.
```

Jika nanti pakai Grok/xAI, gunakan untuk:

- Live commentary.
- Trash talk mode.
- Match recap.
- Social share summary.
- Strategy explanation.

## 10. Claim Page Masih Terlalu Demo

File terkait:

```text
apps/web/src/app/claim/page.tsx
```

Masalah:

- Terlalu banyak kata "demo".
- Terlihat belum production-ready.
- User bisa kehilangan trust.

Yang perlu dilakukan:

- Ubah judul menjadi "Rewards".
- Jadikan disclaimer demo sebagai catatan kecil.
- Tampilkan match history dan claimable rewards.
- Buat flow claim lebih otomatis.

Contoh copy baru:

```text
Rewards
Check your eligible match rewards and refunds.
```

## 11. Smart Contract Belum Terintegrasi Penuh Dengan Product Story

Contract sudah punya:

- Pool.
- Team bet.
- Piece bet.
- Platform fee.
- Treasury.
- Claim reward.
- Claim refund.

Namun product story belum memanfaatkan ini dengan baik.

Yang perlu ditambahkan secara narasi:

- Platform fee dipakai untuk sustain platform.
- Creator share membuat streamer mau host match.
- Treasury bisa split ke platform dan creator.
- Event organizer bisa membuat sponsored tournament.

Kemungkinan pengembangan contract:

- Tambah creator address per game.
- Tambah creatorFeeBps.
- Split fee ke treasury dan creator.
- Tambah event metadata hash.
- Tambah scheduled match support off-chain.

## Business Model Yang Direkomendasikan

## 1. Platform Fee

Ambil fee dari reward pool.

Saran:

```text
Public arena fee: 5%
Creator hosted arena fee: 7.5%
Sponsored tournament fee: custom
```

Jangan jadikan 10% sebagai headline utama karena terasa mahal untuk user baru.

## 2. Creator Revenue Share

Contoh split:

```text
Total fee: 7.5%
Creator gets: 3%
Platform gets: 4.5%
```

Manfaat:

- Creator mau promosi.
- Audience datang dari creator.
- Growth menjadi lebih organic.

## 3. Sponsored Prize Pool

Brand atau sponsor bisa menambah prize pool.

Contoh:

```text
Tonight's AI Boss Battle is boosted by Sponsor X.
```

Revenue:

- Fixed sponsor fee.
- Branding fee.
- Event partnership.

## 4. Premium Creator Tools

Fitur berbayar:

- Custom branding.
- Private arena.
- OBS/Twitch overlay.
- Advanced analytics.
- Custom AI personality.
- Tournament bracket.

Pricing awal:

```text
Free: public arena
Creator Pro: $19/month
Tournament Host: $49/month
Enterprise/Event: custom
```

## 5. Tournament Entry Fee

Mode tournament:

- Community vs community.
- Streamer vs streamer.
- AI boss battle.
- Weekly championship.

Revenue:

- Platform fee dari pool.
- Creator share.
- Sponsor fee.

## Gap Business Model Yang Belum Dibahas

Bagian revenue stream di atas sudah menjelaskan dari mana uang bisa masuk. Namun sebelum dieksekusi, masih ada beberapa hal penting yang harus diputuskan agar model bisnis tidak hanya terlihat bagus di pitch, tapi juga bisa berjalan.

## 1. Siapa Pembeli Utama

Project ini punya beberapa jenis user, tapi tidak semuanya adalah pembeli.

Segmentasi yang lebih jelas:

```text
Players
```

User yang ikut vote, back team, dan mengejar reward. Mereka menyumbang liquidity dan aktivitas.

```text
Creators
```

Streamer atau community host yang membawa audience. Mereka adalah distribution channel utama.

```text
Sponsors
```

Brand, protocol, atau community yang membayar untuk exposure dan sponsored prize pool.

```text
Event organizers
```

Pihak yang ingin membuat tournament atau community battle dengan format siap pakai.

Prioritas eksekusi:

```text
1. Creators
2. Web3 communities
3. Players
4. Sponsors
```

Alasannya: creator dan community membawa distribusi. Kalau hanya mengejar player satu per satu, biaya akuisisi user akan terlalu tinggi.

## 2. Willingness To Pay

Perlu jelas kenapa setiap pihak mau membayar.

Creator mau membayar atau menerima fee karena:

- Mereka bisa mendapat revenue selain donation.
- Live chat jadi lebih aktif.
- Audience punya alasan untuk stay lebih lama.
- Format match bisa jadi konten rutin.

Player mau ikut karena:

- Bisa ikut menentukan match.
- Ada reward upside.
- Ada status sosial lewat leaderboard.
- Ada sensasi kompetisi live.

Sponsor mau membayar karena:

- Ada audience live yang engage.
- Brand tampil di arena, prize pool, recap, dan share result.
- Event bisa dibuat lebih mudah dibanding bikin game dari nol.

Event organizer mau membayar karena:

- Tidak perlu membangun platform sendiri.
- Bisa langsung host tournament.
- Ada reward, leaderboard, dan shareable result.

## 3. Pricing Yang Lebih Konkret

Pricing awal yang direkomendasikan:

```text
Public Arena
Fee: 5% dari reward pool
Creator share: tidak ada atau optional
Use case: match publik bawaan platform
```

```text
Creator Arena
Fee: 7.5% dari reward pool
Creator share: 3%
Platform share: 4.5%
Use case: streamer/community hosted match
```

```text
Sponsored Arena
Fee: 5% sampai 10% dari reward pool
Sponsor fee: fixed deal
Use case: branded event atau prize pool boost
```

```text
Tournament Package
Fee: 10% dari reward pool atau fixed hosting fee
Optional: $49 sampai $499 per event untuk organizer
Use case: weekly tournament, guild battle, creator cup
```

```text
Creator Pro
Subscription: $19/month sampai $49/month
Use case: custom branding, private match, analytics, OBS overlay
```

Catatan penting: jangan terlalu cepat memaksa subscription. Untuk awal, lebih mudah menjual revenue share karena creator tidak perlu bayar di depan.

## 4. Unit Economics Sederhana

Sebelum scale, hitung contoh ekonomi per match.

Contoh Creator Arena:

```text
Total reward pool: $1,000
Total fee 7.5%: $75
Creator share 3%: $30
Platform share 4.5%: $45
Reward untuk winners: $925
```

Jika ada 20 creator aktif per minggu:

```text
Average pool per creator per week: $1,000
Platform revenue per creator: $45
Weekly platform revenue: $900
Monthly platform revenue: sekitar $3,600
```

Jika average pool naik ke $5,000:

```text
Platform revenue per creator per week: $225
20 creators: $4,500/week
Monthly: sekitar $18,000
```

Kesimpulan: bisnis ini sangat bergantung pada tiga hal:

- Jumlah creator aktif.
- Average pool per match.
- Frekuensi match per creator.

North Star Metric yang disarankan:

```text
Weekly Creator-Hosted Reward Pool Volume
```

Bukan hanya DAU atau wallet connected.

## 5. Liquidity Problem

Produk berbasis pool punya masalah klasik: kalau pool kecil, user tidak tertarik; kalau user tidak tertarik, pool tetap kecil.

Solusi awal:

- Platform seeded prize pool untuk match tertentu.
- Sponsored prize boost.
- Guaranteed minimum reward untuk event pilihan.
- Creator harus membawa minimum audience sebelum match dimulai.
- Match bisa scheduled, bukan selalu live random.

Rekomendasi MVP:

```text
Jangan terlalu mengandalkan arena 24/7. Mulai dari scheduled events.
```

Contoh:

```text
Daily AI Boss Battle at 8 PM
Saturday Creator Chess Cup
Community vs Community Friday Match
```

Scheduled event lebih mudah ramai karena semua orang datang pada waktu yang sama.

## 6. Compliance Dan Legal Risk

Karena project melibatkan reward pool dan stake, risiko legal harus dipikirkan dari awal.

Risiko:

- Bisa dianggap gambling di beberapa yurisdiksi.
- Payment provider atau platform bisa menolak kata betting.
- Sponsor dan creator besar mungkin takut ikut jika wording terlalu agresif.
- On-chain pool dengan real money butuh legal review.

Mitigasi:

- Hindari kata betting, gamble, wager, casino.
- Gunakan kata back, stake, support, reward pool, skill-based arena.
- Tonjolkan aspek skill dan strategy.
- Mulai dari testnet atau play-money mode untuk validasi engagement.
- Untuk mainnet, lakukan legal review sebelum public launch.
- Pertimbangkan geofencing jika masuk real-money mode.
- Buat Terms of Service dan Responsible Play page.

Product mode yang lebih aman untuk awal:

```text
Phase 1: Demo/testnet/play-money engagement
Phase 2: Creator points and leaderboard
Phase 3: Sponsored non-cash rewards
Phase 4: Mainnet reward pool after legal review
```

## 7. Trust Dan Fairness

User perlu percaya bahwa sistem tidak dimanipulasi.

Masalah saat ini:

- AI move resolver masih heuristic sederhana.
- Operator/backend sangat trusted.
- Result game ditentukan off-chain.
- User belum bisa melihat audit trail lengkap.

Yang perlu ditambahkan:

- Public move history lengkap.
- Public vote tally per turn.
- Explain why a move was selected.
- Show legal moves for winning piece.
- On-chain event link jika on-chain aktif.
- Smart contract address dan audit status.
- Clear rules page.
- Randomness tidak boleh dipakai untuk hal bernilai uang kecuali jelas sumbernya.

Untuk marketing, fairness bisa dijual sebagai:

```text
Transparent crowd strategy with verifiable rewards.
```

## 8. Go-To-Market Yang Lebih Konkret

Strategi launch yang disarankan:

### Phase 1: Private Creator Test

Target:

- 3 sampai 5 small chess/Web3 creators.
- 20 sampai 100 audience per creator.
- Testnet atau demo mode.

Tujuan:

- Validasi apakah audience mau ikut vote.
- Validasi apakah creator mau host ulang.
- Cari masalah UX.

### Phase 2: Weekly Scheduled Event

Format:

```text
ChessStake Friday AI Boss Battle
```

Tujuan:

- Buat kebiasaan datang.
- Kumpulkan clip dan testimonial.
- Bangun leaderboard awal.

### Phase 3: Community vs Community

Format:

```text
Community A vs Community B
```

Tujuan:

- Memanfaatkan rivalry.
- Mendorong sharing.
- Membuat match lebih emotional.

### Phase 4: Sponsored Tournament

Format:

```text
Sponsored AI Chess Cup
```

Tujuan:

- Revenue sponsorship.
- Public proof bahwa model event bisa dijual.

## 9. Sales Motion

Untuk creator, jangan pitch sebagai game biasa. Pitch sebagai monetization tool.

DM script:

```text
Hey, we built an interactive AI chess arena where your viewers can back a team, vote strategy, and compete together live. You can host a creator match, share one link, and earn a creator share from the arena pool. Want to try a testnet event with your community this week?
```

Untuk sponsor:

```text
We run live AI chess arena events where audiences actively vote and compete. Your brand can boost the prize pool and be featured across the arena, match recap, and shared results. We can host a sponsored community battle around your campaign.
```

Untuk Web3 community:

```text
We can host a community-vs-community AI chess battle for your members. Everyone joins a side, votes strategy, and competes for a transparent reward pool.
```

## 10. Business Risks

Risiko utama:

- Tidak cukup creator yang mau host.
- Pool terlalu kecil sehingga match tidak menarik.
- User bingung karena Web3 onboarding terlalu berat.
- Regulasi real-money pool.
- AI dianggap tidak cukup pintar atau tidak fair.
- Match terlalu lambat atau terlalu panjang.
- Retention rendah setelah novelty habis.

Mitigasi:

- Mulai dengan scheduled creator events.
- Gunakan sponsored/seeded pool awal.
- Buat mode guest/demo tanpa wallet untuk spectator.
- Pakai wallet hanya saat user ingin stake/claim.
- Tambah AI explanation dan public audit trail.
- Batasi durasi game dengan max half moves.
- Tambah leaderboard dan recurring events.

## 11. Product Packaging

Paket yang bisa dijual:

```text
Creator Arena
Untuk streamer yang ingin host match sendiri.
```

```text
Community Battle
Untuk Discord/Web3 community yang ingin event interaktif.
```

```text
Sponsored AI Boss Battle
Untuk brand/protocol yang ingin exposure.
```

```text
Tournament Kit
Untuk organizer yang ingin bracket, leaderboard, dan prize pool.
```

## 12. Minimum Business MVP

Sebelum membangun terlalu banyak fitur, business MVP harus bisa membuktikan:

- Creator bisa membuat atau meminta hosted match.
- Creator bisa share link.
- Audience bisa join tanpa terlalu banyak friction.
- Audience vote lebih dari satu turn.
- Match menghasilkan pool atau engagement yang terlihat.
- Creator mau host lagi.
- Ada data leaderboard/result yang bisa dishare.

Business MVP tidak wajib langsung full on-chain. Yang penting validasi demand dulu.

## 13. Decision Yang Harus Dipilih Sebelum Eksekusi

Sebelum coding lanjutan besar, putuskan:

- Apakah fokus awal ke creator, player, atau sponsor?
- Apakah launch awal testnet/play-money atau mainnet?
- Apakah kata "stake" masih dipakai atau diganti "back/support"?
- Apakah fee awal 5%, 7.5%, atau 10%?
- Apakah creator share wajib dari awal?
- Apakah match selalu scheduled atau ada arena 24/7?
- Apakah AI cukup heuristic dulu atau perlu Stockfish/Grok sebelum launch?
- Apakah target pertama chess streamer, Web3 guild, atau AI community?

Rekomendasi jawaban awal:

```text
Fokus awal: creators and Web3 communities
Launch awal: testnet/play-money scheduled events
Wording: back/support/reward pool
Fee: 7.5% creator arena, split 3% creator and 4.5% platform
Match format: scheduled events first
AI: improve with explanation, Stockfish later
Target first users: small creators and Web3 guilds
```

## Growth Loop Yang Harus Dibangun

## Creator Loop

```text
Creator hosts a match
Creator shares link
Fans join and back teams
Reward pool grows
Creator earns share
Fans share result
Creator hosts again
```

## Competition Loop

```text
User joins team
User votes correctly
User wins reward or rank
User appears on leaderboard
User returns to improve rank
```

## Social Loop

```text
Team is losing
User invites friends
Friends join to flip the pool
Match becomes more exciting
Result is shared
```

## Event Loop

```text
Daily AI Boss Battle
Weekend Creator Tournament
Sponsored Prize Pool
Community Rivalry Match
```

## Roadmap Prioritas

## P0: Product Repositioning

Effort rendah, impact tinggi.

Tasks:

- Ubah copy landing page.
- Hilangkan headline yang terlalu fokus ke betting.
- Tambahkan creator/community angle.
- Tambahkan CTA "Host a Match".
- Tambahkan section revenue dan game modes.

Files:

```text
apps/web/src/app/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/components/arena/ArenaPage.tsx
```

## P1: Improve Arena Conversion

Tasks:

- Tambah match title.
- Tambah host/creator info.
- Tambah share button.
- Tambah spectator count di header.
- Ubah copy voting agar lebih strategic.
- Format raw wei menjadi ETH.
- Tambah progress bar vote per piece.
- Tambah leading piece badge.

Files:

```text
apps/web/src/components/arena/ArenaPage.tsx
apps/web/src/components/voting/VotingPanel.tsx
apps/web/src/components/arena/RewardPoolPanel.tsx
```

## P2: Real Leaderboard

Tasks:

- Buat API leaderboard.
- Tampilkan top bettors.
- Tampilkan top teams.
- Tampilkan biggest pool.
- Tampilkan recent winners.
- Tampilkan player stats.

Files:

```text
apps/web/src/app/leaderboard/page.tsx
apps/web/src/server/game-service.ts
apps/web/src/app/api/leaderboard/route.ts
```

## P3: Match Lobby

Tasks:

- Buat halaman `/matches`.
- Tampilkan live matches.
- Tampilkan upcoming matches.
- Tampilkan completed matches.
- Tambah match cards.
- Tambah CTA join.

Files baru:

```text
apps/web/src/app/matches/page.tsx
apps/web/src/components/matches/MatchCard.tsx
apps/web/src/app/api/matches/route.ts
```

## P4: Creator Mode MVP

Tasks:

- Buat halaman `/host`.
- Buat form host match.
- Tambah model Creator atau HostMatch jika diperlukan.
- Simpan creator name/address.
- Tampilkan creator info di arena.
- Tambah shareable link.

Files baru:

```text
apps/web/src/app/host/page.tsx
apps/web/src/app/api/matches/create/route.ts
apps/web/src/components/host/HostMatchForm.tsx
```

Schema tambahan yang mungkin dibutuhkan:

```prisma
model Creator {
  id        String   @id @default(cuid())
  address   String   @unique
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
}
```

Tambahan field Game:

```prisma
creatorId      String?
title          String?
description    String?
isPublic       Boolean @default(true)
scheduledAt    DateTime?
creatorFeeBps  Int     @default(0)
```

## P5: Viral Share

Tasks:

- Share arena button.
- Share result button.
- Copy link.
- X/Twitter intent URL.
- Generated share copy based on game state.

Possible component:

```text
apps/web/src/components/share/ShareArenaButton.tsx
```

## P6: AI Commentary

Tasks:

- Tambah explanation setelah move.
- Simpan AI commentary di database.
- Tampilkan di move history.
- Jika pakai Grok/xAI, buat service khusus.

Possible files:

```text
apps/web/src/server/ai-commentary.ts
apps/web/src/components/arena/AiCommentaryPanel.tsx
```

Tambahan model Move:

```prisma
aiCommentary String?
```

## P7: On-Chain Product Completion

Tasks:

- Aktifkan kembali on-chain flow.
- Pastikan smart contract deployment jelas.
- Tambah contract address per network.
- Sinkronisasi event contract ke database.
- Buat claim reward/refund on-chain.
- Tambah creator fee support di contract.

Files terkait:

```text
packages/contracts/contracts/PawnPool.sol
apps/web/src/hooks/usePlaceBet.ts
apps/web/src/hooks/useClaimReward.ts
apps/web/src/hooks/useClaimRefund.ts
```

## UX Copy Yang Perlu Diganti

### Hindari

```text
Betting
Gamble
Wager
Casino
```

### Gunakan

```text
Back
Stake
Support
Vote strategy
Reward pool
Community arena
Creator match
```

Contoh penggantian:

```text
Web3 AI Chess Betting
```

menjadi:

```text
Interactive AI Chess Arena
```

```text
Place Your Bet
```

menjadi:

```text
Back This Turn's Strategy
```

```text
Highest pool wins the move
```

menjadi:

```text
The highest-backed legal piece controls the turn
```

## Arah Baru: Player-Owned AI Agents

Fitur AI agent milik player bisa membuat ChessStake jauh lebih unik dibanding sekadar voting chess arena.

Konsep baru:

```text
Crowd-controlled chess with player-owned AI agents.
```

Artinya:

- Player tetap bisa vote manual.
- Player bisa membuat AI agent sendiri.
- Agent punya personality dan strategi.
- Agent bisa memberi rekomendasi bidak/move.
- Agent bisa mewakili player untuk voting jika auto-vote diaktifkan.
- Agent punya statistik, leaderboard, dan reputasi sendiri.

Contoh agent:

- Aggressive Attacker: suka capture dan tekanan ke king.
- Defensive Wall: fokus aman dan posisi solid.
- Gambit Hunter: mau ambil risiko.
- Endgame Grinder: fokus material dan simplifikasi.
- Meme Agent: chaotic tapi tetap legal.

Kenapa ini penting secara bisnis:

- Membuat retention lebih kuat karena user punya aset/persona sendiri.
- Membuka monetization baru seperti premium agent slot, skin/persona, agent league, dan creator-branded agents.
- Membuat AI terasa nyata di produk, bukan hanya label marketing.
- Membuat leaderboard lebih menarik karena bukan hanya player, tapi juga agent.

## Integrasi AI Yang Direkomendasikan

Saat ini project belum benar-benar memakai Grok/xAI. AI yang ada masih heuristic lokal.

Arsitektur ideal:

```text
chess.js = aturan legal catur dan FEN
Stockfish/local evaluator = tactical move scoring
Grok/xAI = reasoning, commentary, personality, recap
Player Agent = strategi personal player untuk vote/rekomendasi
```

Aturan penting:

```text
LLM tidak boleh menjadi sumber validasi move. Semua move harus tetap divalidasi oleh chess.js.
```

Tahap implementasi terbaik:

1. Local deterministic agent scoring dulu.
2. Agent recommendation di arena.
3. Agent decision history.
4. Agent leaderboard.
5. AI commentary.
6. Baru integrasi Grok/xAI untuk reasoning dan personality.
7. Auto-vote hanya setelah ada limit dan legal/compliance review.

## Model Bisnis Tambahan Dari AI Agent

Revenue tambahan:

- Free user dapat 1 basic agent.
- Pro user dapat multiple agents.
- Paid strategy presets.
- Creator-branded community agent.
- Agent league seasonal pass.
- Sponsored agents.
- Marketplace fee jika template agent bisa dijual nanti.

Pricing awal yang masuk akal:

```text
Free: 1 basic agent
Agent Pro: $5-$9/month
Creator Agent: included in Creator Pro
Agent League: seasonal pass or event entry fee
```

## Gameplay Dengan AI Agent

Mode baru yang bisa dibuat:

```text
Manual Crowd Mode
```

Player vote manual seperti sekarang.

```text
Agent Assist Mode
```

Agent memberi rekomendasi, player klik confirm.

```text
Agent Auto-Vote Mode
```

Agent voting otomatis sesuai limit dan aturan player.

```text
Agent League
```

Agent bersaing di leaderboard berdasarkan performa.

```text
Creator Agent Battle
```

Creator/community punya agent sendiri untuk melawan agent komunitas lain.

```text
Human Crowd vs AI Agent
```

Satu sisi dikontrol crowd, satu sisi dikontrol agent AI.

## Roadmap AI Agent

Paling aman dieksekusi begini:

```text
AI-0: Jelaskan AI resolver yang sekarang
AI-1: Tambah AI commentary sederhana
AI-2: Buat Player Agent Builder MVP
AI-3: Agent recommendation di voting panel
AI-4: Agent decision history dan leaderboard
AI-5: Auto-vote dengan strict limits
AI-6: Grok/xAI untuk reasoning dan commentary
AI-7: Agent League dan creator/community agents
```

## Metrics Yang Harus Dipantau

Untuk tahu project ini benar-benar bisa ramai, pantau metrics berikut:

- Daily active users.
- New wallets connected.
- Number of votes per match.
- Average prize pool per match.
- Match completion rate.
- Share button click rate.
- Invite conversion rate.
- Creator-hosted matches per week.
- Returning users.
- Claim rate.
- Platform fee generated.
- Creator revenue generated.

## MVP Bisnis Yang Lebih Matang

Versi MVP berikutnya harus punya:

- Landing page dengan creator positioning.
- Live arena yang terlihat seperti event.
- Voting panel dengan progress/ranking.
- Leaderboard nyata.
- Share button.
- Host match MVP.
- Match lobby sederhana.
- Rewards page yang tidak terlalu demo.

Jika semua ini ada, project akan terasa seperti produk, bukan hanya prototype.

## Final Product Narrative

Narasi akhir yang disarankan:

```text
ChessStake is a live strategy arena where creators host AI-powered chess battles and audiences back teams, vote strategy, and share rewards.
```

Pitch pendek:

```text
Live gaming audiences are passive, and creators need better monetization than ads and donations. ChessStake turns spectators into active participants through AI-powered chess arenas where fans back teams, vote strategy, and compete for reward pools. We monetize through platform fees, creator revenue share, sponsored tournaments, and premium creator tools.
```

## Checklist Eksekusi

- [ ] Rework landing page copy.
- [ ] Tambah Host a Match CTA.
- [ ] Tambah creator/community section.
- [ ] Tambah game modes section.
- [ ] Ubah arena header agar punya match title dan host.
- [ ] Tambah share arena button.
- [ ] Format vote amount dari wei ke ETH.
- [ ] Tambah progress bar voting.
- [ ] Tambah leading piece badge.
- [ ] Tambah pool percentage White vs Black.
- [ ] Buat leaderboard real.
- [ ] Buat match lobby.
- [ ] Buat host match MVP.
- [ ] Tambah AI commentary.
- [ ] Buat rewards page lebih production-like.
- [ ] Rancang creator revenue share.
- [ ] Rancang sponsored tournament flow.
- [ ] Siapkan on-chain integration roadmap.
