WITH
 rebalancesRaw as (
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v1_ethereum.VaultMath_call_getTotalAmounts
    WHERE call_success = true
    UNION
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v2_ethereum.VaultMathV2_call_getTotalAmounts
    WHERE call_success = true
    UNION
    SELECT
      date_trunc('day', call_block_time) as day,
      'rebalance' as "type",
      call_block_number as block_number,
      cast(output_0 as DOUBLE) / 1e18 as amountWeth,
      cast(output_1 as DOUBLE) / 1e6 as amountUSDC,
      cast(output_2 as DOUBLE) / 1e18 as amountOSQTH
    FROM
      liqui_hedgehog_math_v3_ethereum.VaultMathV3_call_getTotalAmounts
    WHERE call_success = true
  ),
  rebalancesFilters as (
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v1_ethereum.VaultAuction_call_timeRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v1_ethereum.VaultAuction_call_priceRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v2_ethereum.VaultAuction_call_timeRebalance
    WHERE call_success = true
    UNION
    SELECT call_block_number as block_number
    FROM liqui_hedgehog_auction_v2_ethereum.VaultAuction_call_priceRebalance
    WHERE call_success = true
  ),
  rebalancesFiltered as (
    SELECT r.*
    FROM rebalancesRaw AS r
    INNER JOIN rebalancesFilters AS f
    ON r.block_number = f.block_number
  )
SELECT * from rebalancesFiltered
