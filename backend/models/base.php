<?php
	if(!isset($Base))
	{
		class Base
		{
			var $id;
			function get($id)
			{
				require("./../config.php");
				$tablename = $this->_get_tablename();
				$link = mysql_connect($db_host, $db_username, $db_password)
				   or die('Could not connect: ' . mysql_error());
				mysql_select_db($db_name) or die('Could not select database');
                                if(!is_numeric($id))
                                {
                                    $id = "'" . mysql_real_escape_string($id) . "'"; 
                                }
				$query = "SELECT * FROM ${tablename} WHERE ID=${id} LIMIT 1";
				$result = mysql_query($query) or die('Query failed: ' . mysql_error());
				$line = mysql_fetch_array($result, MYSQL_ASSOC);
				if($line)
				{
					$p = $this->_makeModel($line);
					mysql_free_result($result);
					mysql_close($link);
					return $p;
				}
				else
				{
					mysql_free_result($result);
					mysql_close($link);
					return false;
				}
			}
			function filter($feild, $value)
			{
				require("./../config.php");
				$tablename = $this->_get_tablename();
				$link = mysql_connect($db_host, $db_username, $db_password)
				   or die('Could not connect: ' . mysql_error());
				mysql_select_db($db_name) or die('Could not select database');
				if(is_array($feild) && is_array($value))
				{
					$query = "SELECT * FROM ${tablename} WHERE ";
					for($i=0; $i < count($feild); $i++)
					{
						
						$query .= mysql_real_escape_string($feild[$i]) . "=\"" . mysql_real_escape_string($value[$i]) . "\"";
						if($i != count($feild)-1) { $query .= " AND "; }
					}
				}
				else {
					$feild = mysql_real_escape_string($feild);
					//TODO: format value's datatype accordingly
					$value = mysql_real_escape_string($value);
					$query = "SELECT * FROM ${tablename} WHERE ${feild}=\"${value}\"";
				}
				$result = mysql_query($query) or die('Query failed: ' . mysql_error());
				$list = Array();
				while($line = mysql_fetch_array($result, MYSQL_ASSOC))
				{
					array_push($list, $this->_makeModel($line));
					$results = TRUE;
				}
				mysql_free_result($result);
				mysql_close($link);
				if(!isset($results)) { return false; }
				else { return $list; }
			}
			function all()
			{
				require("./../config.php");
				$tablename = $this->_get_tablename();
				$link = mysql_connect($db_host, $db_username, $db_password)
				   or die('Could not connect: ' . mysql_error());
				mysql_select_db($db_name) or die('Could not select database');
				$result = mysql_query("SELECT * FROM ${tablename}") or die('Query failed: ' . mysql_error());
				$list = Array();
				while($line = mysql_fetch_array($result, MYSQL_ASSOC))
				{
					array_push($list, $this->_makeModel($line));
				}
				mysql_free_result($result);
				mysql_close($link);
				return $list;
			}
			function save()
			{
				require("./../config.php");
				$link = mysql_connect($db_host, $db_username, $db_password)
				   or die('Could not connect: ' . mysql_error());
				mysql_select_db($db_name) or die('Could not select database');
				if(isset($this->id))
				{
					mysql_query($this->_make_mysql_query($this->_get_tablename(), "update")) or die('Query failed: ' . mysql_error());
				}
				else
				{
					mysql_query($this->_make_mysql_query($this->_get_tablename(), "insert")) or die('Query failed: ' . mysql_error());
				}
				if(!isset($this->id)) { $this->id = mysql_insert_id(); }
				mysql_close($link);
			}		
			function _get_tablename()
			{
				require("./../config.php");
				if(isset($this->_tablename))
				{
					$tablename=$this->_tablename;
				}
				else
				{
					$tablename=strtolower(get_class($this));
				}
				return $db_prefix . $tablename;
			}
			function _makeModel($line)
			{
				$p = new $this;
				foreach ($line as $key => $value)
				{
					$p->$key = $value;
				}
				if(isset($line['ID']))
				{
					$p->id = $line['ID'];
					unset($p->ID);
				}
				return $p;
			}
			function _make_mysql_query($table, $type)
			{
				$i = 0;
				//for some reason count($this) returns 0 so...
				$length = $this->count()-1;
				if($type == "update") { $sql = "UPDATE ${table} SET "; }
				else { $sql = "INSERT INTO ${table} SET "; }
				foreach($this as $key => $value)
				{
					if($key != "_tablename")
					{
						if($key == "id")
						{
							$key = "ID";
						}
						if(is_int($value))
						{
							$sql .= mysql_real_escape_string($key) . "=" . $value;
						}
						else
						{
							//when all else fails, make it a string
							$sql .= mysql_real_escape_string($key) . "=\"" . mysql_real_escape_string($value) ."\"";
						}
						if($i != $length)
						{
							$sql .= ", ";
						}
						else
						{
							$sql .= " ";
						}
					}
					$i++;
				}
				$id=$this->id;
				if($type == "update") { $sql .= " WHERE ID=${id} LIMIT 1"; }
				return $sql;
			}
			function count()
			{
				//for some reason count($this) returns 0 so...
				$length = 0;
				foreach($this as $key => $value)
				{
					if($key != "_tablename")
					{
						$length++;
					}
				}
				return $length;
			}
			function delete()
			{
				if(isset($this->id))
				{
					require("./../config.php");
                                	$link = mysql_connect($db_host, $db_username, $db_password)
                                	   or die('Could not connect: ' . mysql_error());
                                	mysql_select_db($db_name) or die('Could not select database');
					mysql_query("DELETE FROM " . $this->_get_tablename() . " WHERE ID=" . $this->id . " LIMIT 1") or die('Query failed: ' . mysql_error());
                                	mysql_close($link);
				}
			}
			function from_postdata($postdata, $list)
			{
				if (get_magic_quotes_gpc())
				{
					foreach($list as $key)
					{
						$postdata[$key] = stripslashes($postdata[$key]);
					}
				}
				foreach($list as $key)
				{
					$this->$key = $postdata[$key];
				}
			}
			function make_json()
			{
				$p = "({";
				$length = $this->count()-1;
				$i=0;
				foreach($this as $key => $value)
				{
					if($key != "_tablename")
					{
						$value = addslashes($value);
						$value = str_replace("\r", "\\r", $value);
						$value = str_replace("\n", "\\n", $value);
						$p .= "\"". addslashes($key) . "\":";
                                                if(is_int($value) || $key == "id") {$p .= $value;}
                                                else {$p .= "\"" . $value . "\"";}
						if($i != $length)
						{
							$p .= ",";
						}
					}
					$i++;
				}
				$p .= "})";
				return $p;
			}
		}
		$Base = new Base();
	}
?>
