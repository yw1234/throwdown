import MySQLdb

class db_api(object):
    def __init__(self):
        """
        parse configuration
        """
        self.hostip = "127.0.0.1"
        self.user = "root"
        self.passwd = ""
        self.dbname = "myboly"
        self.tablename = "trial"   # modify to health later
        self.port = 3306
        self.charset ="utf8"

    def conn(self):
        """
        connecting to the database
        """
        try:
            conn = MySQLdb.connect(host=self.hostip, user=self.user,
                                   passwd=self.passwd, db=self.dbname,
                                   port=int(self.port), charset=self.charset)
            conn.ping(True)
            return conn
        except MySQLdb.Error, e:
            error_msg = 'Error {}: {}'.format(e.args[0], e.args[1])
            print error_msg

    def disconnect(self):
        conn = self.conn()
        conn.close()

    def get_healthest_lsp(self):
        try:
            conn = self.conn()
            cur = conn.cursor()

            cur.execute("select lsp from {}".format(self.tablename))
            res = int(cur.fetchone()[0])

            return res
        except Exception, e:
            print str(e)
            return -1


if __name__ == "__main__":
    cc = db_api()
    print cc.get_healthest_lsp() 
