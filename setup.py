from setuptools import setup, find_packages

setup(
    name = "db-timeliner",
    version = "0.01",
    author = "Ulas Tuerkmen ",
    install_requires = ['psycopg2'],
    packages=find_packages(),
    zip_safe=False,
    entry_points = {'console_scripts': ['db-timeliner = db_timeliner:main']}
)
