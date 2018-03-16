const { SigningKey, utils } = require('ethers')

function toBuffer (raw) {
  if (typeof raw === 'string') 
    return utils.toUtf8Bytes(raw)

  if (typeof raw === 'number')
    return utils.toUtf8Bytes(raw)

  return utils.toUtf8Bytes(JSON.stringify(raw))
}

function recover (payload, signature) {
  const [r, s, v] = utils.RLP.decode(signature)

  const payloadBuffer = toBuffer(payload)
  const payloadDigest = utils.keccak256(payloadBuffer)
  
  return SigningKey.recover(payloadDigest, r, s, parseInt(v, 16) - 27)
}

module.exports = {
  toBuffer,
  recover
}