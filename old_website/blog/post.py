import os
import shutil

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
# Path to the folder containing Markdown files
posts_dir = os.path.join(current_dir, 'posts')
# Path to the HTML file
html_file = os.path.join(current_dir, 'index.html')
# Base URL for the posts
base_url = 'https://marvyn.com/blog/posts/'

added_posts_file = os.path.join(current_dir,'added_posts.txt')
template_file = os.path.join(current_dir,'template.html')

# Template for each post div
post_div_template = '''
<div class="column code">
    <div class="content">
        <a href="{post_url}"><img src="{post_image}" alt="{post_title}" width="100%"></a>
        <div class="description">
            <h1>{post_title}</h1>
            <p>{post_excerpt}</p>
        </div>
        <div class="buttonholder">
            <button><a href="{post_url}">Read More</a></button>
        </div>
    </div>
</div>
'''

def extract_metadata(md_file):
    metadata = {
        'title': 'No Title',
        'description': 'No Description',
        'cover_image': 'https://marvyn.com/images/default_thumbnail.png'
    }
    with open(md_file, 'r') as file:
        lines = file.readlines()
        for line in lines:
            if line.startswith('[comment]: <> (Title:'):
                metadata['title'] = line.split(':', 1)[1].strip().rstrip(')')[11:]
            elif line.startswith('[comment]: <> (Description:'):
                metadata['description'] = line.split(':', 1)[1].strip().rstrip(')')[16:]
            elif line.startswith('[comment]: <> (Cover image path:'):
                metadata['cover_image'] = line.split(':', 1)[1].strip().rstrip(')')[22:]
            # Stop reading after the first three lines
            if lines.index(line) >= 2:
                break
    return metadata



def load_added_posts(added_posts_file):
    if os.path.exists(added_posts_file):
        with open(added_posts_file, 'r') as file:
            return set(line.strip() for line in file)
    return set()

def save_added_posts(added_posts_file, added_posts):
    with open(added_posts_file, 'w') as file:
        for post in added_posts:
            file.write(f'{post}\n')


def generate_post_divs_and_create_index(posts_dir, template_file, added_posts):
    if not os.path.exists(posts_dir):
        print(f'The directory {posts_dir} does not exist.')
        return ''

    post_divs = ''
    new_posts = set()
    for root, dirs, files in os.walk(posts_dir):
        if 'notes.md' in files:
            post_dir = os.path.relpath(root, posts_dir)
            
            if post_dir in added_posts:
                continue
            
            md_file_path = os.path.join(root, 'notes.md')
            metadata = extract_metadata(md_file_path)

            
            
            post_title = metadata['title']
            post_url = f'{base_url}{post_dir}/index.html'
            post_excerpt = metadata['description']
            post_image = f'https://marvyn.com/blog/posts/{post_dir}/images/{metadata["cover_image"]}'
            
            
            # post_name = os.path.basename(root)
            # post_url = f'{base_url}{post_dir}/index.html'
            # post_title = post_name.replace('-', ' ').title()
            # post_excerpt = 'A brief description of the post.'
            # post_image = 'https://marvyn.com/images/default_thumbnail.png'  # Default image, update if needed

            post_divs += post_div_template.format(
                post_url=post_url,
                post_image=post_image,
                post_title=post_title,
                post_excerpt=post_excerpt
            )

            # Copy the template.html to the post directory and rename it to index.html
            index_path = os.path.join(root, 'index.html')
            shutil.copy(template_file, index_path)
            new_posts.add(post_dir)
            
            print(f'Created {index_path}')
    return post_divs,new_posts

def insert_post_divs_into_html(html_file, post_divs):
    with open(html_file, 'r') as file:
        html_content = file.read()

    # Find the .row div and replace its content with the new post divs
    new_html_content = html_content.replace(
        '<div class="row">', 
        '<div class="row">\n' + post_divs + '\n'
    )

    with open(html_file, 'w') as file:
        file.write(new_html_content)

if __name__ == '__main__':
    print(f'Checking posts directory: {posts_dir}')
    added_posts = load_added_posts(added_posts_file)
    post_divs, new_posts = generate_post_divs_and_create_index(posts_dir, template_file, added_posts)
    if post_divs:
        insert_post_divs_into_html(html_file, post_divs)
        added_posts.update(new_posts)
        save_added_posts(added_posts_file, added_posts)
        print('Inserted {} post divs into {}'.format(len(post_divs.split('class="column code"')) - 1, html_file))
    else:
        print('No post divs were found or generated.')