WITH 
    demo_data as (
        SELECT 
            1 AS event_id, 
            '2021-06-06' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            1 AS event_id, 
            '2021-06-07' AS measured_on, 
            5 AS measurement
        UNION ALL 
        SELECT 
            1 AS event_id, 
            '2021-06-08' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            1 AS event_id, 
            '2021-06-09' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-22' AS measured_on, 
            42 AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-23' AS measured_on, 
            42 AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-25' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-26' AS measured_on, 
            11 AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-27' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            2 AS event_id, 
            '2021-05-27' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            3 AS event_id, 
            '2021-07-01' AS measured_on, 
            NULL AS measurement
        UNION ALL 
        SELECT 
            3 AS event_id, 
            '2021-07-03' AS measured_on, 
            NULL AS measurement
    )
    SELECT
        event_id,
        measured_on,
        measurement,
        MAX(measurement) OVER (PARTITION BY event_id, grouper) as forward_filled
    FROM
        (
            SELECT
                event_id,
                measured_on,
                measurement,
                COUNT(measurement) OVER (PARTITION BY event_id ORDER BY measured_on) as grouper
            FROM
                demo_data
        ) as grouped
    ORDER BY
        event_id,
        measured_on