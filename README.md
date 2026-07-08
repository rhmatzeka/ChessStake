# PawnPool - Web3 AI Chess Betting Arena.

PawnPool adalah arena permainan catur Web3 berbasis kecerdasan buatan (AI) di mana penonton (spectators) dapat connect wallet, memilih tim (White/Black), dan memasang taruhan (bet) untuk mem-vote jenis bidak yang akan digerakkan. Gerakan bidak sesungguhnya tidak ditentukan oleh manusia, melainkan dihitung secara realtime oleh AI Agent menggunakan logic legal move.

---

## Konsep Inti

1. **AI-Driven Movement**: Menghilangkan faktor kecurangan/sabotase dari pemain manusia. AI selalu melangkah secara optimal untuk bidak yang memenangkan voting.
2. **Tiered Betting per Piece**: Setiap bidak memiliki harga vote yang berbeda:
   - Pawn: 0.0001 ETH
   - King: 0.0002 ETH
   - Knight: 0.0003 ETH
   - Bishop: 0.0003 ETH
   - Rook: 0.0005 ETH
   - Queen: 0.0010 ETH
3. **Turn Rules**:
   - Durasi voting per turn adalah 20 detik.
   - User hanya boleh memasang taruhan 1 kali per turn.
   - User tidak boleh pindah tim (White/Black) setelah first bet di game tersebut.
   - Jika satu turn tidak mendapat vote, timer dibuka ulang maksimal 3 kali sebelum game dibatalkan otomatis (auto-cancel).
4. **Pool & Settlement**:
   - Pemenang mendapatkan 90% dari total pool (White + Black pool combined) secara proporsional.
   - Platform/developer fee adalah 10%, ditarik otomatis ke treasury saat game resolve.
   - Draw refund mengembalikan 90% pool secara proporsional ke semua bettor.
   - Cancel game mengembalikan 100% pool (tanpa platform fee).
   - Late transaction (tx confirmed setelah turn lock) tidak dihitung sebagai vote dan dapat diklaim refund 100% tanpa fee.

---

## Tech Stack

- **Frontend**: Next.js App Router (TypeScript, Tailwind CSS, Zustand, TanStack Query, ConnectKit + Wagmi v2 + Viem)
- **Backend**: Express.js (TypeScript, Socket.IO, Prisma ORM + PostgreSQL)
- **Smart Contract**: Solidity (Hardhat, OpenZeppelin v5, deployed on Ethereum Sepolia)
- **AI Logic**: chess.js + Stockfish heuristik resolver

---

## Struktur Folder Project

```text
pawnpool/
├── apps/
│   ├── web/                          # Next.js Frontend Website
│   └── api/                          # Express REST API & Socket.IO Server
├── packages/
│   ├── contracts/                    # Hardhat Smart Contracts (Solidity)
│   └── shared/                       # Global Constants & Type-safe ABI exports
├── infra/                            # Docker compose & configuration
├── package.json                      # Workspace configuration
└── pnpm-workspace.yaml
```

---

## Persiapan & Instalasi

### 1. Prasyarat System
- Node.js >= 20
- pnpm >= 9
- PostgreSQL & Redis (atau PostgreSQL local)

### 2. Setup Project Dependencies
Jalankan di root folder:
```bash
pnpm install --no-frozen-lockfile --ignore-scripts
```

### 3. Setup Environment Variables
Salin `.env.example` ke `.env` di root project dan sesuaikan nilainya:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/pawnpool
RPC_ETHEREUM_SEPOLIA=https://ethereum-sepolia-rpc.publicnode.com
PRIVATE_KEY=your_private_key
```

### 4. Setup Database & Prisma
Masuk ke `apps/api` dan run generate client & migration:
```bash
npx prisma generate
```

---

## Menjalankan Project (Local Development)

### 1. Compile Smart Contracts
Jalankan kompilasi Solidity di packages/contracts:
```bash
npx hardhat compile
```
Untuk menjalankan unit tests:
```bash
npx hardhat test
```

### 2. Build Shared Package
Build constants & ABI compiler:
```bash
pnpm --filter shared build
```

### 3. Run Dev Server (API & Frontend)
Gunakan Turbo untuk menjalankan dev environment secara paralel dari root folder:
```bash
pnpm dev
```
- Frontend berjalan di: http://localhost:3000
- Backend API berjalan di: http://localhost:4000

---

## Security & Invariants

- **ReentrancyGuard**: Dipakai pada penarikan rewards & refunds.
- **AccessControl**: Membagi otorisasi admin (`DEFAULT_ADMIN_ROLE`) dan backend operator (`OPERATOR_ROLE`).
- **Late Refund Safe accounting**: late bet dikeluarkan dari game.totalPool dan dipisahkan ke pool refundable user.
- **Idempotent Indexing**: Log events di-track menggunakan log index dan transaction hash agar aman dari reorg & replay.
