const express = require('express');
const router = express.Router();
const { connectToOracleDB } = require('../dbs');
const oracledb = require('oracledb');


//updating order status
router.post('/insert-basket-status', async function (req, res, next) {
  try {
    const { basketId, date, shipper, shipNum } = req.body;
    const connection = await connectToOracleDB();
   

    await connection.execute(
      `CREATE OR REPLACE PROCEDURE status_ship_sp (
              p_basketid IN bb_basketstatus.idbasket%TYPE,
              p_date     IN VARCHAR2,
              p_shipper  IN bb_basketstatus.shipper%TYPE,
              p_shipnum  IN bb_basketstatus.shippingnum%TYPE
          ) IS
          BEGIN
              INSERT INTO bb_basketstatus (
                  idstatus,
                  idbasket,
                  idstage,
                  dtstage,
                  shipper,
                  shippingnum
              ) VALUES (
                  bb_status_seq.NEXTVAL,
                  p_basketid,
                  3,
                  TO_DATE(p_date, 'YYYY-MM-DD'),
                  p_shipper,
                  p_shipnum
              );
              COMMIT;
          END status_ship_sp;`
    );
    const result = await connection.execute(
      `BEGIN
          status_ship_sp(p_basketid => :basketId, 
            p_date => :date, 
            p_shipper => :shipper, 
            p_shipnum => :shipNum);
      END;`,
      { basketId, date, shipper, shipNum }
    );
    res.status(201).send('Order shipping information updated successfully');
  } catch (error) {
    console.error('Error inserting basket status:', error);
    res.status(500).send('Error inserting basket status');
  }
});

router.get('/list', async (req, res) => {
  let connection;

  try {
    connection = await connectToOracleDB();
    const result = await connection.execute(
      `SELECT IDBASKET as id FROM bb_basket`,
    );
    const baskets = result.rows.map(row => { return { id: row[0] } });
    res.json({ baskets });
  } catch (error) {
    console.error('Error fetching basketIds:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
    }
  }
});

router.get('/list-items', async function (req, res, next) {
  try {
    const { basketId } = req.query
    connection = await connectToOracleDB();
    const result = await connection.execute(
      `SELECT
      bb_basketitem.idproduct, bb_basketitem.price, bb_basketitem.quantity
      FROM
      bb_basketitem
      where idbasket = ${basketId}`,
      [],
      { maxRows: 30 }
    );
    const itemsResult = result.rows.map(row => {
      const obj = {};
      result.metaData.forEach((meta, index) => {
        obj[meta.name] = row[index];
      });
      return obj;
    });
    console.log(result);
    res.json({ result: itemsResult });
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

module.exports = router;