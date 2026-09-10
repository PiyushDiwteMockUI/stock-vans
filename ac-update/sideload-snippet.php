
add_action('rest_api_init', function () {
	register_rest_route('wlstock/v1', '/sideload', array(
		'methods' => 'POST',
		'permission_callback' => function () { return current_user_can('upload_files'); },
		'callback' => function ($req) {
			$url = esc_url_raw($req['url']);
			$name = sanitize_file_name($req['filename']);
			if (!$url || !$name) return new WP_Error('bad_request', 'url and filename required', array('status' => 400));
			$allowed = array('caravancampingsales.pxcrush.net', 'jealstorage.blob.core.windows.net');
			if (!in_array(wp_parse_url($url, PHP_URL_HOST), $allowed, true)) {
				return new WP_Error('bad_host', 'host not allowed', array('status' => 400));
			}
			$existing = get_posts(array('post_type' => 'attachment', 'name' => pathinfo($name, PATHINFO_FILENAME), 'posts_per_page' => 1, 'post_status' => 'inherit'));
			if ($existing) return array('id' => $existing[0]->ID, 'url' => wp_get_attachment_url($existing[0]->ID), 'existed' => true);
			require_once ABSPATH . 'wp-admin/includes/file.php';
			require_once ABSPATH . 'wp-admin/includes/media.php';
			require_once ABSPATH . 'wp-admin/includes/image.php';
			$tmp = download_url($url, 60);
			if (is_wp_error($tmp)) return $tmp;
			$id = media_handle_sideload(array('name' => $name, 'tmp_name' => $tmp), 0);
			if (is_wp_error($id)) { @unlink($tmp); return $id; }
			return array('id' => $id, 'url' => wp_get_attachment_url($id), 'existed' => false);
		},
	));
});
