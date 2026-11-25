// The Ramps API returns an optional deposit `memo` (tag) on sell orders, next to
// `depositWallet`. Until `@consensys/on-ramp-sdk` ships it, declare it here.
import '@consensys/on-ramp-sdk/dist/API/api';

declare module '@consensys/on-ramp-sdk/dist/API/api' {
  interface SellOrder {
    /** Memo/tag that must accompany the transfer to `depositWallet` (e.g. Stellar). */
    memo?: string;
  }
}
