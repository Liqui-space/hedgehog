WITH
  poolEthUsdcBurn as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      date_trunc('minute', evt_block_time) as minute,
      -cast(amount as DOUBLE) / 1e18 as liquidity
    FROM
      uniswap_v3_ethereum.Pair_evt_Burn
    WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8
  ),
  poolEthUsdcBurnDaily as (
    SELECT day, SUM(liquidity) from poolEthUsdcBurn GROUP BY day 
  ),
  poolEthOsqthBurnDaily as (
    SELECT day, SUM(liquidity) as liquidity from (
      SELECT
        date_trunc('day', evt_block_time) as day,
        date_trunc('minute', evt_block_time) as minute,
        -cast(amount as DOUBLE) / 1e18 as liquidity
      FROM uniswap_v3_ethereum.Pair_evt_Burn
      WHERE owner = 0x12804580C15F4050dda61D44AFC94623198848bC AND contract_address = 0x82c427AdFDf2d245Ec51D8046b41c4ee87F0d29C
    ) GROUP BY day 
  )