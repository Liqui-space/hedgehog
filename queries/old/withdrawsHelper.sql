WITH
  sceleton AS (
    SELECT
      DATE_TRUNC('day', minute) as day
    FROM
      prices.usd
    WHERE blockchain = 'ethereum' AND symbol = 'WETH'
      AND (DATE_TRUNC('day', minute) >= CAST('2022-10-02' AS TIMESTAMP))
    GROUP BY DATE_TRUNC('day', minute)
  ),
  withdraws as (
    SELECT
      date_trunc('day', evt_block_time) as day,
      date_trunc('minute', evt_block_time) as minute,
      -cast(shares as DOUBLE) / 1e18 as shares,
      -cast(amountEth as DOUBLE) / 1e18 as amountWeth,
      -cast(amountUsdc as DOUBLE) / 1e6 as amountUSDC,
      -cast(amountOsqth as DOUBLE) / 1e18 as amountOSQTH
    from
      liqui_hedgehog_ethereum.Vault_evt_Withdraw
  ),
  ethInitialPrice as (
    SELECT price AS eth_initial, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'WETH') AND date_trunc('minute', minute) in (SELECT DISTINCT minute FROM withdraws)
  ),
  osqthInitialPrice as (
    SELECT price AS osqth_initial, minute
    FROM prices.usd
    WHERE (blockchain = 'ethereum' AND symbol = 'oSQTH') AND date_trunc('minute', minute) in (SELECT DISTINCT minute FROM withdraws)
  ),
  tb as (
    SELECT 
      sceleton.day,
      withdrawsG.shares,
      withdrawsG.amountWeth,
      withdrawsG.amountUSDC,
      withdrawsG.amountOSQTH
    from sceleton
    left join withdrawsG on sceleton.day = withdrawsG.day
  )
  withdrawsG as (
    SELECT
      day,
      SUM(shares) as shares,
      SUM(amountWeth) as amountWeth,
      SUM(amountUSDC) as amountUSDC,
      SUM(amountOSQTH) as amountOSQTH
    FROM
      withdraws
    GROUP BY day
  ),

  SELECT * from tb order by day