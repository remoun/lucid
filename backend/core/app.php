<?php
/*
    Psych Desktop
    Copyright (C) 2006 Psychiccyberfreak

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
	*/
	require("../configuration.php");
	require("../models/base.php");
	require("./../models/app.php");
    if($_GET['section'] == "fetch")
	{
		if($_GET['action'] == "full")
		{
			header("Content-type: text/plain");
			$p = $App->get($_POST['id']);
			echo $p->make_json();
		}
		if($_GET['action'] == "list")
		{
			$p = $App->all();
			$pl = count($p)-1;
			echo "[";
			foreach($p as $d => $v)
			{
				echo $v->make_json(Array("id", "name", "category"));
				if($d < $pl) { echo ",\n"; }
			}
			echo "]";
		}
	}
?>
