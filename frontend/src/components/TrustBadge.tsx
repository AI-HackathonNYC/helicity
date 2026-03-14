import type { JuryResult } from '../lib/types'

interface Props {
  ipfsCid: string | null
  jury: JuryResult | null
}

export function TrustBadge({ ipfsCid, jury }: Props) {
  if (!ipfsCid && !jury) return null

  const isMock = ipfsCid?.startsWith('QmMock') ?? false
  const gatewayUrl = ipfsCid ? `https://gateway.pinata.cloud/ipfs/${ipfsCid}` : null
  const truncatedCid = ipfsCid
    ? `${ipfsCid.slice(0, 8)}...${ipfsCid.slice(-4)}`
    : null

  return (
    <div className="bg-white rounded-xl border border-black/6 p-6">
      <h3 className="text-sm font-semibold text-[#0f0f0f] uppercase tracking-wider mb-4">
        Verification &amp; Trust
      </h3>

      <div className="space-y-3">
        {/* IPFS verification row */}
        {ipfsCid && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isMock ? 'bg-[#e17055]' : 'bg-[#00b894]'}`} />
              <span className="text-sm text-[#555]">
                {isMock ? 'IPFS Verification (Demo)' : 'Verified on IPFS'}
              </span>
            </div>
            {gatewayUrl && (
              <a
                href={gatewayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[#6c5ce7] hover:underline"
              >
                {truncatedCid}
              </a>
            )}
          </div>
        )}

        {/* Model consensus row */}
        {jury && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-[#555]">
              <span>Claude: <strong className="text-[#0f0f0f]">{jury.claude_score.toFixed(0)}</strong></span>
              <span>Gemini: <strong className="text-[#0f0f0f]">{jury.gemini_score.toFixed(0)}</strong></span>
              <span>Delta: <strong className="text-[#0f0f0f]">{jury.delta.toFixed(0)}</strong></span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              jury.consensus
                ? 'bg-[#00b894]/10 text-[#00b894]'
                : 'bg-[#e17055]/10 text-[#e17055]'
            }`}>
              {jury.consensus ? 'SIGNAL CONFIRMED' : 'MODELS DIVERGE'}
            </span>
          </div>
        )}

        {/* Oracle-ready label */}
        <div className="flex items-center gap-2 pt-1 border-t border-black/4">
          <span className="text-[10px] text-[#bbb] uppercase tracking-wider">
            TEE-ready for Chainlink
          </span>
          {isMock && (
            <span className="text-[10px] text-[#e17055] font-medium">
              Demo Mode — IPFS verification simulated
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
