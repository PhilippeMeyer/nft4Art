import sharp  from 'sharp';


const input = '/home/philippe/Desktop/nft4Art/PoS/server/cache/bafybeiacbitckg7brmmrbcoagmzc6azlkrtnwclbowt7rbsj3isv66toda';
//1024*1024
sharp(input).resize(1004, 1004, {fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 }})
    .extend({ top: 10, bottom: 10, left: 10, right: 10, background: { r: 255, g: 255, b: 255, alpha: 1 }})
    .toFile('resized.png');